// ez az utvonal a kerdesekkel foglalkozik
// listazas, egy kerdes lekerese, uj kerdes felvitele

const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// KERDESEK LISTAZASA
// lehet szurni kategoriara es nehezsegre a query stringben
// pl /api/questions?category=1&difficulty=easy
router.get("/", function (req, res) {
  const kategoria = req.query.category;
  const nehezseg = req.query.difficulty;

  // felepitunk egy sql-t attol fuggoen mit szurunk
  let sql = "SELECT q.id, q.question_text, q.difficulty, q.points, c.name AS kategoria " +
            "FROM questions q JOIN categories c ON c.id = q.category_id WHERE 1 = 1";
  const parameterek = [];

  if (kategoria) {
    sql = sql + " AND q.category_id = ?";
    parameterek.push(kategoria);
  }
  if (nehezseg) {
    sql = sql + " AND q.difficulty = ?";
    parameterek.push(nehezseg);
  }

  sql = sql + " ORDER BY q.id";

  const kerdesek = db.prepare(sql).all(parameterek);
  res.json(kerdesek);
});

// EGY KERDES LEKERESE A VALASZOKKAL EGYUTT
// itt sem kuldjuk el az is_correct mezot ugyanazert az okert, mint a kvizeknel
router.get("/:id", function (req, res) {
  const id = req.params.id;

  const kerdes = db.prepare("SELECT * FROM questions WHERE id = ?").get(id);
  if (!kerdes) {
    return res.status(404).json({ hiba: "nincs ilyen kerdes" });
  }

  const valaszok = db.prepare("SELECT id, answer_text FROM answers WHERE question_id = ?").all(id);
  kerdes.valaszok = valaszok;

  res.json(kerdes);
});

// UJ KERDES FELVITELE
// ehhez host vagy admin jog kell
// a body-ban jon a kategoria, nehezseg, kerdes szoveg, es a valaszok tomb
router.post("/", auth.beKellJelentkezni, auth.hostVagyAdmin, function (req, res) {
  const categoryId = req.body.category_id;
  const difficulty = req.body.difficulty;
  const kerdesSzoveg = req.body.question_text;
  const valaszok = req.body.valaszok; // ez egy tomb, minden elem: { szoveg, helyes }

  // egyszeru ellenorzes hogy minden megvan-e
  if (!categoryId || !difficulty || !kerdesSzoveg || !valaszok) {
    return res.status(400).json({ hiba: "hianyzik valamelyik mezo" });
  }
  if (valaszok.length < 2) {
    return res.status(400).json({ hiba: "legalabb 2 valasz kell" });
  }

  // kiszamoljuk a pontot a nehezseg alapjan
  let pont = 10;
  if (difficulty === "medium") {
    pont = 20;
  }
  if (difficulty === "hard") {
    pont = 30;
  }

  // elmentjuk a kerdest
  const ujKerdes = db.prepare(
    "INSERT INTO questions (category_id, difficulty, question_text, points, created_by, is_public) VALUES (?, ?, ?, ?, ?, 1)"
  ).run(categoryId, difficulty, kerdesSzoveg, pont, req.session.userId);

  const kerdesId = ujKerdes.lastInsertRowid;

  // elmentjuk a valaszokat egyesevel
  for (let i = 0; i < valaszok.length; i++) {
    let v = valaszok[i];
    let helyesE = 0;
    if (v.helyes === true) {
      helyesE = 1;
    }
    db.prepare("INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)")
      .run(kerdesId, v.szoveg, helyesE);
  }

  res.json({ uzenet: "uj kerdes elmentve", kerdesId: kerdesId });
});

module.exports = router;
