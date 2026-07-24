// ez az utvonal a kvizekkel (kerdessorokkal) foglalkozik
// listazas, egy kviz kerdesei, es uj kviz osszeallitasa/mentese

const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// KVIZEK LISTAZASA
// alapbol a nyilvanos kvizeket adja vissza
router.get("/", function (req, res) {
  const kvizek = db.prepare(
    "SELECT q.id, q.title, q.description, q.mode, u.username AS keszito " +
    "FROM quizzes q JOIN users u ON u.id = q.created_by " +
    "WHERE q.is_public = 1 ORDER BY q.id"
  ).all();
  res.json(kvizek);
});

// EGY KVIZ KERDESEI SORRENDBEN, A VALASZOKKAL EGYUTT
// ezt hasznalja a jatek kepernyo amikor kitolteni kezdunk
router.get("/:id", function (req, res) {
  const id = req.params.id;

  const kviz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(id);
  if (!kviz) {
    return res.status(404).json({ hiba: "nincs ilyen kviz" });
  }

  // lekerjuk a kviz kerdeseit sorrendben
  const kerdesek = db.prepare(
    "SELECT q.id, q.question_text, q.difficulty, q.points, qq.position " +
    "FROM quiz_questions qq JOIN questions q ON q.id = qq.question_id " +
    "WHERE qq.quiz_id = ? ORDER BY qq.position"
  ).all(id);

  // minden kerdeshez hozzarakjuk a valaszokat is
  for (let i = 0; i < kerdesek.length; i++) {
    let k = kerdesek[i];
    let valaszok = db.prepare("SELECT id, answer_text, is_correct FROM answers WHERE question_id = ?").all(k.id);
    k.valaszok = valaszok;
  }

  kviz.kerdesek = kerdesek;
  res.json(kviz);
});

// UJ KVIZ OSSZEALLITASA ES MENTESE
// ehhez be kell jelentkezni
// a body-ban jon a cim, leiras, mod, es egy kerdes id tomb a kivant sorrendben
router.post("/", auth.beKellJelentkezni, function (req, res) {
  const title = req.body.title;
  const description = req.body.description;
  const mode = req.body.mode;
  const kerdesIdk = req.body.kerdesIdk; // pl [3, 7, 12]

  if (!title || !kerdesIdk || kerdesIdk.length === 0) {
    return res.status(400).json({ hiba: "cim es legalabb egy kerdes kell" });
  }

  // ha nem adtak meg modot akkor legyen classic
  let vegsoMode = mode;
  if (!vegsoMode) {
    vegsoMode = "classic";
  }

  // elmentjuk a kviz fejadatat
  const ujKviz = db.prepare(
    "INSERT INTO quizzes (title, description, created_by, mode, is_public) VALUES (?, ?, ?, ?, 1)"
  ).run(title, description, req.session.userId, vegsoMode);

  const kvizId = ujKviz.lastInsertRowid;

  // elmentjuk a kerdeseket a kviz-hez, sorrendben
  for (let i = 0; i < kerdesIdk.length; i++) {
    let pozicio = i + 1;
    db.prepare("INSERT INTO quiz_questions (quiz_id, question_id, position) VALUES (?, ?, ?)")
      .run(kvizId, kerdesIdk[i], pozicio);
  }

  res.json({ uzenet: "kviz elmentve", kvizId: kvizId });
});

module.exports = router;
