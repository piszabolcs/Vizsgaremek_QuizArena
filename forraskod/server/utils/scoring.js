// ebben a fajlban van a pontszamitas es az xp/szint logika
// szandekosan kulon fuggvenyekre bontottam hogy konnyebb legyen tesztelni

// ez kiszamolja hany pontot er egy valasz
// ha jo a valasz akkor a kerdes pontjat kapja, plusz ido bonusz ha idore megy
// ha rossz, akkor a kerdes pontjanak fele levonasra kerul (buntetes)
function pontEgyKerdesre(helyesE, kerdesPont, idoreMegy, hatralevoMasodperc) {
  if (helyesE === false) {
    return -(kerdesPont / 2);
  }

  let pont = kerdesPont;

  if (idoreMegy === true) {
    let bonusz = hatralevoMasodperc;
    if (bonusz > 10) {
      bonusz = 10;
    }
    if (bonusz < 0) {
      bonusz = 0;
    }
    pont = pont + bonusz;
  }

  return pont;
}

// ez osszeadja egy egesz kviz pontjait
// a valaszok egy tomb, minden elemben benne van hogy jo volt-e stb
// a vegeredmeny sose lehet negativ, akkor sem, ha sok buntetes volt
function kvizOsszpont(valaszok) {
  let osszeg = 0;
  for (let i = 0; i < valaszok.length; i++) {
    let v = valaszok[i];
    osszeg = osszeg + pontEgyKerdesre(v.helyes, v.pont, v.idoreMegy, v.ido);
  }
  if (osszeg < 0) {
    osszeg = 0;
  }
  return osszeg;
}

// ebbol szamoljuk mennyi xp jar egy kviz utan
// az alap az elert pont fele, es ha nyert a jatekos akkor kap plusz 50-et
function xpSzamitas(elertPont, nyertE) {
  let xp = Math.floor(elertPont / 2);
  if (nyertE === true) {
    xp = xp + 50;
  }
  return xp;
}

// ez megnezi hogy az uj osszes xp alapjan hanyas szinten van a jatekos
// a szinteket egy tombben kapja meg (mindegyikben van level_number es xp_required)
function szintKiszamitas(osszesXp, szintek) {
  // alapbol az elso szinten vagyunk
  let aktualisSzint = 1;

  // vegigmegyunk a szinteken es megnezzuk melyiket ertuk mar el
  for (let i = 0; i < szintek.length; i++) {
    let sz = szintek[i];
    if (osszesXp >= sz.xp_required) {
      aktualisSzint = sz.level_number;
    }
  }

  return aktualisSzint;
}

// milliomos modban minden teljesitett 5-os blokk utan jar egy plusz xp adag
function merfoldkoBonusz(helyesDb) {
  let blokkok = Math.floor(helyesDb / 5);
  return blokkok * 75;
}

module.exports = {
  pontEgyKerdesre: pontEgyKerdesre,
  kvizOsszpont: kvizOsszpont,
  xpSzamitas: xpSzamitas,
  szintKiszamitas: szintKiszamitas,
  merfoldkoBonusz: merfoldkoBonusz
};
