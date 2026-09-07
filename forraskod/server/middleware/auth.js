// ez a middleware megnezi hogy be van-e jelentkezve a felhasznalo
// ha nincs, akkor visszakuldi hogy nincs jogosultsag

function beKellJelentkezni(req, res, next) {
  // ha van user a session-ben akkor tovabb engedjuk
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ hiba: "ehhez be kell jelentkezni" });
  }
}

// ez megnezi hogy a felhasznalo host vagy admin-e
// ilyenkor tud pl uj kerdest felvenni
function hostVagyAdmin(req, res, next) {
  if (req.session && (req.session.role === "host" || req.session.role === "admin")) {
    next();
  } else {
    res.status(403).json({ hiba: "ehhez host vagy admin jog kell" });
  }
}

module.exports = {
  beKellJelentkezni: beKellJelentkezni,
  hostVagyAdmin: hostVagyAdmin
};
