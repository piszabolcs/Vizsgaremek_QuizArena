// ez az utvonal a ranglistat adja vissza
// az xp alapjan rendezzuk a jatekosokat csokkeno sorrendben

const express = require("express");
const db = require("../config/db");

const router = express.Router();

// RANGLISTA LEKERESE
// alapbol a top 20 jatekost adja vissza xp szerint
router.get("/", function (req, res) {
  const ranglista = db.prepare(
    "SELECT u.username, u.xp, u.total_wins, u.total_games, l.title AS szint " +
    "FROM users u JOIN levels l ON l.id = u.level_id " +
    "ORDER BY u.xp DESC " +
    "LIMIT 20"
  ).all();

  // hozzarakunk egy helyezes mezot is 1-tol kezdve
  for (let i = 0; i < ranglista.length; i++) {
    ranglista[i].helyezes = i + 1;
  }

  res.json(ranglista);
});

module.exports = router;
