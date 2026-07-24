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
