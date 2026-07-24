// ez a fajl nyitja meg az sqlite adatbazist
// az egesz app innen keri le a kapcsolatot

const path = require("path");
const Database = require("better-sqlite3");

// megkeressuk hol van a db file (a db mappaban van)
const dbFile = path.join(__dirname, "..", "..", "db", "quizarena.db");

// megnyitjuk az adatbazist
const db = new Database(dbFile);

// bekapcsoljuk az idegen kulcsokat, mert alapbol ki van kapcsolva sqlite-ban
db.pragma("foreign_keys = ON");

console.log("adatbazis megnyitva innen:", dbFile);

module.exports = db;
