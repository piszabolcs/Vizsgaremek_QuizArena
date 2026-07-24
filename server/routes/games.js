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
// a body-ban: quizId, es egy valaszok tomb
//   minden valasz: { questionId, valasztottAnswerId, ido (hatralevo mp, ha idore ment) }
// a mode-ot a kvizbol olvassuk ki
router.post("/submit", auth.beKellJelentkezni, function (req, res) {
  const quizId = req.body.quizId;
  const beadottValaszok = req.body.valaszok;

  if (!quizId || !beadottValaszok) {
    return res.status(400).json({ hiba: "quizId es valaszok kellenek" });
  }

  // lekerjuk a kvizt hogy tudjuk milyen modu
  const kviz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  if (!kviz) {
    return res.status(404).json({ hiba: "nincs ilyen kviz" });
  }

  // eldontjuk hogy idore ment-e a jatek
  let idoreMegy = false;
  if (kviz.mode === "timed") {
    idoreMegy = true;
  }

  // vegigmegyunk a beadott valaszokon es ellenorizzuk oket az adatbazisbol
  // ezt azert csinaljuk szerveroldalon hogy ne lehessen csalni
  let ertekeltValaszok = [];
  let helyesDb = 0;

  for (let i = 0; i < beadottValaszok.length; i++) {
    let bv = beadottValaszok[i];

    // lekerjuk a kerdest hogy tudjuk hany pontot er
    let kerdes = db.prepare("SELECT * FROM questions WHERE id = ?").get(bv.questionId);
    if (!kerdes) {
      continue; // ha valamiert nincs ilyen kerdes akkor kihagyjuk
    }

    // megnezzuk hogy a valasztott valasz helyes-e
    let valasz = db.prepare("SELECT * FROM answers WHERE id = ?").get(bv.valasztottAnswerId);
    let helyesE = false;
    if (valasz && valasz.is_correct === 1) {
      helyesE = true;
      helyesDb = helyesDb + 1;
    }

    // elrakjuk a scoring fuggvenynek megfelelo formaban
    ertekeltValaszok.push({
      helyes: helyesE,
      pont: kerdes.points,
      idoreMegy: idoreMegy,
      ido: bv.ido || 0
    });
  }

  // kiszamoljuk az osszpontot a scoring segedfajllal
  let osszPont = scoring.kvizOsszpont(ertekeltValaszok);

  // eldontjuk hogy nyert-e a jatekos
  // egyszeru szabaly: ha a kerdesek tobb mint felere jol valaszolt akkor nyert
  let nyertE = false;
  if (helyesDb > beadottValaszok.length / 2) {
    nyertE = true;
  }

  // kiszamoljuk mennyi xp jar
  let kapottXp = scoring.xpSzamitas(osszPont, nyertE);

  // lekerjuk a jatekos jelenlegi adatait
  let user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
  let ujXp = user.xp + kapottXp;

  // lekerjuk a szinteket hogy ujra tudjuk szamolni a szintet
  let szintek = db.prepare("SELECT * FROM levels ORDER BY level_number").all();
  let ujSzint = scoring.szintKiszamitas(ujXp, szintek);

  // frissitjuk a jatekost: uj xp, uj szint, jatekok szama, es ha nyert akkor a gyozelmek is
  let ujGyozelem = user.total_wins;
  if (nyertE === true) {
    ujGyozelem = ujGyozelem + 1;
  }
  let ujJatekok = user.total_games + 1;

  db.prepare("UPDATE users SET xp = ?, level_id = ?, total_wins = ?, total_games = ? WHERE id = ?")
    .run(ujXp, ujSzint, ujGyozelem, ujJatekok, user.id);

  // elmentjuk az eredmenyt a results tablaba
  db.prepare(
    "INSERT INTO results (user_id, quiz_id, score, correct_count, time_spent) VALUES (?, ?, ?, ?, ?)"
  ).run(user.id, quizId, osszPont, helyesDb, 0);

  // visszakuldjuk az eredmenyt a frontendnek
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
