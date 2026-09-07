// ezek a tesztek a pontszamito logikat ellenorzik
// a node beepitett teszt futtatojat hasznaljuk, igy nem kell kulon csomag
// futtatas: npm test

const test = require("node:test");
const assert = require("node:assert");
const scoring = require("../server/utils/scoring");

// TESZT 1: rossz valasz eseten buntetes jar (a kerdes pontjanak fele, negativ elojellel)
test("rossz valasz eseten buntetes jar", function () {
  let pont = scoring.pontEgyKerdesre(false, 20, false, 0);
  assert.strictEqual(pont, -10);
});

// TESZT 2: jo valaszra a kerdes pontja jar ha nem idore megy
test("jo valasz eseten a kerdes pontja jar", function () {
  let pont = scoring.pontEgyKerdesre(true, 20, false, 0);
  assert.strictEqual(pont, 20);
});

// TESZT 3: idore menonel a hatralevo ido bonuszt ad
test("idore menonel ido bonusz jar", function () {
  // 20 pontos kerdes, jo valasz, 5 masodperc maradt -> 20 + 5 = 25
  let pont = scoring.pontEgyKerdesre(true, 20, true, 5);
  assert.strictEqual(pont, 25);
});

// TESZT 4: az ido bonusz maximum 10 lehet
test("az ido bonusz maximum 10", function () {
  // ha 30 masodperc maradt akkor is csak 10 bonusz jar
  let pont = scoring.pontEgyKerdesre(true, 20, true, 30);
  assert.strictEqual(pont, 30);
});

// TESZT 5: egy egesz kviz osszpontja jol adodik ossze (buntetessel egyutt)
test("kviz osszpont helyesen adodik ossze", function () {
  let valaszok = [
    { helyes: true, pont: 10, idoreMegy: false, ido: 0 },
    { helyes: true, pont: 20, idoreMegy: false, ido: 0 },
    { helyes: false, pont: 30, idoreMegy: false, ido: 0 }
  ];
  let ossz = scoring.kvizOsszpont(valaszok);
  assert.strictEqual(ossz, 15); // 10 + 20 - 15 (a 30-as kerdes fele levonva)
});

// TESZT 6: az xp az elert pont fele, plusz 50 ha nyert
test("xp szamitas nyeres eseten", function () {
  // 100 pont fele az 50, plusz 50 a nyeresert = 100
  let xp = scoring.xpSzamitas(100, true);
  assert.strictEqual(xp, 100);
});

// TESZT 7: az xp az elert pont fele ha nem nyert
test("xp szamitas veszteseg eseten", function () {
  // 100 pont fele az 50, nincs bonusz
  let xp = scoring.xpSzamitas(100, false);
  assert.strictEqual(xp, 50);
});

// TESZT 8: a szint jol szamolodik az xp alapjan
test("szint kiszamitas az xp alapjan", function () {
  let szintek = [
    { level_number: 1, xp_required: 0 },
    { level_number: 2, xp_required: 100 },
    { level_number: 3, xp_required: 300 }
  ];
  // 150 xp eseten a 2. szinten vagyunk (mert 100-at elertuk de 300-at meg nem)
  let szint = scoring.szintKiszamitas(150, szintek);
  assert.strictEqual(szint, 2);
});

// TESZT 9: a kviz osszpont sose negativ, meg csupa rossz valasz eseten se
test("a kviz osszpont sose negativ", function () {
  let valaszok = [
    { helyes: false, pont: 20, idoreMegy: false, ido: 0 }
  ];
  let ossz = scoring.kvizOsszpont(valaszok);
  assert.strictEqual(ossz, 0);
});

// TESZT 10: minden 5 helyes valasz utan +75 xp jar (milliomos mod)
test("merfoldko bonusz minden 5 helyes valasz utan", function () {
  assert.strictEqual(scoring.merfoldkoBonusz(4), 0);
  assert.strictEqual(scoring.merfoldkoBonusz(5), 75);
  assert.strictEqual(scoring.merfoldkoBonusz(9), 75);
  assert.strictEqual(scoring.merfoldkoBonusz(10), 150);
});
