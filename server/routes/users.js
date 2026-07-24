// ez az utvonal a felhasznalo sajat adatait adja vissza
// pl a profil oldalhoz kell

const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// A BEJELENTKEZETT FELHASZNALO ADATAI
router.get("/me", auth.beKellJelentkezni, function (req, res) {
  const user = db.prepare(
    "SELECT u.id, u.username, u.email, u.xp, u.total_wins, u.total_games, l.title AS szint, l.level_number " +
    "FROM users u JOIN levels l ON l.id = u.level_id WHERE u.id = ?"
  ).get(req.session.userId);

  if (!user) {
    return res.status(404).json({ hiba: "nincs ilyen felhasznalo" });
  }

  res.json(user);
});

// A FELHASZNALO KORABBI EREDMENYEI
router.get("/me/results", auth.beKellJelentkezni, function (req, res) {
  const eredmenyek = db.prepare(
    "SELECT r.score, r.correct_count, r.time_spent, r.played_at, q.title AS kviz " +
    "FROM results r JOIN quizzes q ON q.id = r.quiz_id " +
    "WHERE r.user_id = ? ORDER BY r.played_at DESC"
  ).all(req.session.userId);

  res.json(eredmenyek);
});

// A FELHASZNALO SAJAT MENTETT KVIZEI
router.get("/me/quizzes", auth.beKellJelentkezni, function (req, res) {
  const kvizek = db.prepare(
    "SELECT id, title, description, mode FROM quizzes WHERE created_by = ? ORDER BY id DESC"
  ).all(req.session.userId);

  res.json(kvizek);
});

// A KATEGORIAK LISTAJA (ezt tobb helyen is hasznaljuk a frontenden)
router.get("/categories/all", function (req, res) {
  const kategoriak = db.prepare("SELECT id, name, description FROM categories ORDER BY name").all();
  res.json(kategoriak);
});

module.exports = router;
