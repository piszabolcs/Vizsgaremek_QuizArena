// ez az utvonal kezeli a regisztraciot, bejelentkezest es kijelentkezest

const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");

const router = express.Router();

// ez a kis fuggveny csinal a jelszobol egy hash-t
// igy nem tiszta szovegkent taroljuk (vizsgan bcrypt lenne az ajanlott)
function jelszoHash(jelszo) {
  return crypto.createHash("sha256").update(jelszo).digest("hex");
}

// REGISZTRACIO
// a frontend kuld egy username, email es jelszo mezot
router.post("/register", function (req, res) {
  const username = req.body.username;
  const email = req.body.email;
  const jelszo = req.body.jelszo;

  // megnezzuk hogy ki van-e toltve minden
  if (!username || !email || !jelszo) {
    return res.status(400).json({ hiba: "minden mezot ki kell tolteni" });
  }

  // megnezzuk hogy letezik-e mar ilyen felhasznalo vagy email
  const megvan = db.prepare("SELECT id FROM users WHERE username = ? OR email = ?").get(username, email);
  if (megvan) {
    return res.status(400).json({ hiba: "ez a felhasznalonev vagy email mar foglalt" });
  }

  // elmentjuk az uj felhasznalot, alap szint 1, alap xp 0
  const hash = jelszoHash(jelszo);
  const eredmeny = db.prepare(
    "INSERT INTO users (username, email, password_hash, xp, level_id, role) VALUES (?, ?, ?, 0, 1, 'player')"
  ).run(username, email, hash);

  res.json({ uzenet: "sikeres regisztracio", userId: eredmeny.lastInsertRowid });
});

// BEJELENTKEZES
// email es jelszo alapjan
router.post("/login", function (req, res) {
  const email = req.body.email;
  const jelszo = req.body.jelszo;

  if (!email || !jelszo) {
    return res.status(400).json({ hiba: "email es jelszo kell" });
  }

  // megkeressuk a felhasznalot email alapjan
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(400).json({ hiba: "nincs ilyen felhasznalo" });
  }

  // osszehasonlitjuk a jelszo hash-t
  const hash = jelszoHash(jelszo);
  if (hash !== user.password_hash) {
    return res.status(400).json({ hiba: "hibas jelszo" });
  }

  // ha minden ok, elmentjuk a session-be hogy ki van bejelentkezve
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.username = user.username;

  res.json({ uzenet: "sikeres bejelentkezes", username: user.username, role: user.role });
});

// KIJELENTKEZES
router.post("/logout", function (req, res) {
  // toroljuk a session-t
  req.session.destroy(function () {
    res.json({ uzenet: "kijelentkezve" });
  });
});

module.exports = router;
