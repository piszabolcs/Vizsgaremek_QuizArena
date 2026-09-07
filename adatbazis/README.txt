QuizArena - adatbazis

quizarena_er_diagram.png
  Az adatmodell ER-diagramja: mind a 11 tabla, az oszlopokkal es az idegen kulcs
  kapcsolatokkal.

schema.sql
  A relacios adatbazis-sema MySQL nyelvjarasban (DDL). Ez a vizsgafeladat altal
  elvart referencia-sema.

seed.sql
  A kezdoadatok (szintek, kategoriak) MySQL INSERT utasitasokkal.

Fontos: az alkalmazas maga fejlesztes es futtatas kozben SQLite-ot hasznal
(better-sqlite3), az egyszerubb, szerver-telepites nelkuli futtathatosag
erdekeben - ezt a vizsgafeladat kifejezetten megengedi. Az SQLite-valtozatu,
teljes adatfeltoltest vegzo szkript itt talalhato:
  ../forraskod/db/build_db.js  (futtatasa: npm run seed a forraskod mappaban)

Ez a szkript hozza letre a forraskod/db/quizarena.db futo adatbazist, es
tolti fel 80 kerdessel, 10 kategoriaval, 7 szinttel es 5 teszt-felhasznaloval.
