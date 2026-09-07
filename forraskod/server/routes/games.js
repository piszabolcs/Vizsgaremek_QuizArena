// ez az utvonal a jatszassal foglalkozik
// itt lehet egy kvizt kitolteni es a vegen kiszamoljuk a pontot es az xp-t
// a pontszamitas szerveroldalon tortenik, nem bizzuk a frontendre

const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const scoring = require("../utils/scoring");

const router = express.Router();

// EGY KVIZ BEKULDESE / KIERTEKELESE
// a jatekos kitolti a kvizt a bongeszoben, majd beküldi a valaszait
// a body-ban: quizId, valaszok tomb, es elteltMasodperc (mennyi ido telt el a kviz elejetol)
//   minden valasz: { questionId, valasztottAnswerId, ido (hatralevo mp, ha idore/milliomos modban megy) }
// a mode-ot a kvizbol olvassuk ki
router.post("/submit", auth.beKellJelentkezni, function (req, res) {
  const quizId = req.body.quizId;
  const beadottValaszok = req.body.valaszok;
  const elteltMasodperc = req.body.elteltMasodperc || 0;

  if (!quizId || !beadottValaszok) {
    return res.status(400).json({ hiba: "quizId es valaszok kellenek" });
  }

  const kviz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  if (!kviz) {
    return res.status(404).json({ hiba: "nincs ilyen kviz" });
  }

  let idoreMegy = false;
  if (kviz.mode === "timed") {
    idoreMegy = true;
  }

  let ertekeltValaszok = [];
  let helyesDb = 0;

  for (let i = 0; i < beadottValaszok.length; i++) {
    let bv = beadottValaszok[i];

    let kerdes = db.prepare("SELECT * FROM questions WHERE id = ?").get(bv.questionId);
    if (!kerdes) {
      continue;
    }

    // az "AND question_id = ?" azert kell, nehogy egy masik kerdesrol
    // "kolcsonzott" helyes valasz-id-t el lehessen fogadtatni
    let valasz = db.prepare("SELECT * FROM answers WHERE id = ? AND question_id = ?").get(bv.valasztottAnswerId, bv.questionId);
    let helyesE = false;
    if (valasz && valasz.is_correct === 1) {
      helyesE = true;
      helyesDb = helyesDb + 1;
    }

    ertekeltValaszok.push({
      helyes: helyesE,
      pont: kerdes.points,
      idoreMegy: idoreMegy,
      ido: bv.ido || 0
    });
  }

  let osszPont = scoring.kvizOsszpont(ertekeltValaszok);

  let nyertE = false;
  if (helyesDb > beadottValaszok.length / 2) {
    nyertE = true;
  }

  let kapottXp = scoring.xpSzamitas(osszPont, nyertE);

  // milliomos modban minden 5 helyes valasz utan jar egy plusz xp adag
  if (kviz.mode === "millionaire") {
    kapottXp = kapottXp + scoring.merfoldkoBonusz(helyesDb);
  }

  let user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
  let ujXp = user.xp + kapottXp;

  let szintek = db.prepare("SELECT * FROM levels ORDER BY level_number").all();
  let ujSzint = scoring.szintKiszamitas(ujXp, szintek);

  let ujGyozelem = user.total_wins;
  if (nyertE === true) {
    ujGyozelem = ujGyozelem + 1;
  }
  let ujJatekok = user.total_games + 1;

  db.prepare("UPDATE users SET xp = ?, level_id = ?, total_wins = ?, total_games = ? WHERE id = ?")
    .run(ujXp, ujSzint, ujGyozelem, ujJatekok, user.id);

  db.prepare(
    "INSERT INTO results (user_id, quiz_id, score, correct_count, time_spent) VALUES (?, ?, ?, ?, ?)"
  ).run(user.id, quizId, osszPont, helyesDb, elteltMasodperc);

  res.json({
    uzenet: "kviz kiertekelve",
    osszPont: osszPont,
    helyesValaszok: helyesDb,
    osszKerdes: beadottValaszok.length,
    nyert: nyertE,
    kapottXp: kapottXp,
    ujOsszesXp: ujXp,
    ujSzint: ujSzint
  });
});

// EGY VALASZ GYORS ELLENORZESE (milliomos modhoz kell)
// ez NEM menti el az eredmenyt, csak megmondja jo volt-e a valasz,
// hogy a kliens el tudja donteni folytatja-e a jatekot vagy kiesett
router.post("/check-answer", auth.beKellJelentkezni, function (req, res) {
  const questionId = req.body.questionId;
  const valasztottAnswerId = req.body.valasztottAnswerId;

  if (!questionId) {
    return res.status(400).json({ hiba: "questionId kell" });
  }

  const valasz = db.prepare("SELECT * FROM answers WHERE id = ? AND question_id = ?").get(valasztottAnswerId, questionId);

  let helyesE = false;
  if (valasz && valasz.is_correct === 1) {
    helyesE = true;
  }

  res.json({ helyes: helyesE });
});

// FELEZES SEGITSEG: ket rossz valasz azonositojat adja vissza, amit a frontend elrejthet
router.post("/hint/fifty-fifty", auth.beKellJelentkezni, function (req, res) {
  const questionId = req.body.questionId;
  if (!questionId) {
    return res.status(400).json({ hiba: "questionId kell" });
  }

  const rosszValaszok = db.prepare("SELECT id FROM answers WHERE question_id = ? AND is_correct = 0").all(questionId);

  if (rosszValaszok.length < 2) {
    return res.status(400).json({ hiba: "nincs eleg rossz valasz ehhez a kerdeshez" });
  }

  for (let i = rosszValaszok.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let csere = rosszValaszok[i];
    rosszValaszok[i] = rosszValaszok[j];
    rosszValaszok[j] = csere;
  }

  const elrejtendo = [rosszValaszok[0].id, rosszValaszok[1].id];
  res.json({ elrejtendoValaszok: elrejtendo });
});

// KOZONSEG SEGITSEG: szimulalt szazalekos megoszlas a valaszlehetosegek kozott
// a helyes valasz nagyobb esellyel kap magasabb szazalekot, de sose 100%-ot
router.post("/hint/audience", auth.beKellJelentkezni, function (req, res) {
  const questionId = req.body.questionId;
  if (!questionId) {
    return res.status(400).json({ hiba: "questionId kell" });
  }

  const valaszok = db.prepare("SELECT id, is_correct FROM answers WHERE question_id = ?").all(questionId);
  if (valaszok.length === 0) {
    return res.status(404).json({ hiba: "nincs ilyen kerdes" });
  }

  const helyesSzazalek = 45 + Math.floor(Math.random() * 26); // 45-70 kozott
  const maradek = 100 - helyesSzazalek;

  const rosszValaszok = [];
  for (let i = 0; i < valaszok.length; i++) {
    if (valaszok[i].is_correct !== 1) {
      rosszValaszok.push(valaszok[i].id);
    }
  }

  const sulyok = [];
  let sulyOsszeg = 0;
  for (let i = 0; i < rosszValaszok.length; i++) {
    let suly = Math.random();
    sulyok.push(suly);
    sulyOsszeg = sulyOsszeg + suly;
  }

  const eredmeny = {};
  for (let i = 0; i < valaszok.length; i++) {
    if (valaszok[i].is_correct === 1) {
      eredmeny[valaszok[i].id] = helyesSzazalek;
    }
  }

  let felhasznaltSzazalek = 0;
  for (let i = 0; i < rosszValaszok.length; i++) {
    let resz;
    if (i === rosszValaszok.length - 1) {
      resz = maradek - felhasznaltSzazalek;
    } else {
      resz = Math.round((sulyok[i] / sulyOsszeg) * maradek);
      felhasznaltSzazalek = felhasznaltSzazalek + resz;
    }
    eredmeny[rosszValaszok[i]] = resz;
  }

  res.json({ szazalekok: eredmeny });
});

// CSERE SEGITSEG: ad egy masik, azonos nehezsegu kerdest, ami meg nincs ebben a kvizben
router.post("/hint/swap", auth.beKellJelentkezni, function (req, res) {
  const quizId = req.body.quizId;
  const questionId = req.body.questionId;

  if (!quizId || !questionId) {
    return res.status(400).json({ hiba: "quizId es questionId kell" });
  }

  const aktualisKerdes = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId);
  if (!aktualisKerdes) {
    return res.status(404).json({ hiba: "nincs ilyen kerdes" });
  }

  const kvizKerdesek = db.prepare("SELECT question_id FROM quiz_questions WHERE quiz_id = ?").all(quizId);
  const kizartIdk = [];
  for (let i = 0; i < kvizKerdesek.length; i++) {
    kizartIdk.push(kvizKerdesek[i].question_id);
  }

  const jeloltek = db.prepare(
    "SELECT id, question_text, difficulty, points FROM questions WHERE difficulty = ? AND id != ?"
  ).all(aktualisKerdes.difficulty, questionId);

  const hasznalhato = [];
  for (let i = 0; i < jeloltek.length; i++) {
    if (kizartIdk.indexOf(jeloltek[i].id) === -1) {
      hasznalhato.push(jeloltek[i]);
    }
  }

  if (hasznalhato.length === 0) {
    return res.status(404).json({ hiba: "nincs tobb cserelheto kerdes ezen a nehezsegen" });
  }

  const veletlenIndex = Math.floor(Math.random() * hasznalhato.length);
  const ujKerdes = hasznalhato[veletlenIndex];

  const valaszok = db.prepare("SELECT id, answer_text FROM answers WHERE question_id = ?").all(ujKerdes.id);

  res.json({
    id: ujKerdes.id,
    question_text: ujKerdes.question_text,
    difficulty: ujKerdes.difficulty,
    points: ujKerdes.points,
    valaszok: valaszok
  });
});

// CSAPATOS JATEK LETREHOZASA (egyszerusitett)
// a host letrehoz egy jatekmenetet egy kvizbol
router.post("/", auth.beKellJelentkezni, auth.hostVagyAdmin, function (req, res) {
  const quizId = req.body.quizId;
  if (!quizId) {
    return res.status(400).json({ hiba: "quizId kell" });
  }

  const ujMenet = db.prepare(
    "INSERT INTO game_sessions (quiz_id, host_id, mode, status) VALUES (?, ?, 'team', 'waiting')"
  ).run(quizId, req.session.userId);

  res.json({ uzenet: "jatekmenet letrehozva", sessionId: ujMenet.lastInsertRowid });
});

module.exports = router;
