// ez a kviz kitolto oldal logikaja
// harom mod van: classic (egyben mutatjuk az osszes kerdest),
// timed es millionaire (egyszerre csak 1 kerdest mutatunk, idozitovel)

let aktualisKviz = null;
let kezdesIdopontja = 0;

// klasszikus modhoz (egyben kitoltos)
// pl { 12: 45 }  ->  a 12-es kerdesre a 45-os valaszt valasztottuk
let kivalasztottValaszok = {};

// idore meno es milliomos modhoz (soros, kerdesenkenti kitoltes)
let sorosIndex = 0;
let sorosValaszok = [];
let sorosHelyesDb = 0;
let idozitoMaradek = 20;
let idozitoTimer = null;

// milliomos segitsegek allapota (egyszer hasznalhatoak egy jatekmeneten belul)
let felezesHasznalva = false;
let kozonsegHasznalva = false;
let csereHasznalva = false;

// amikor betolt az oldal, kiolvassuk a kviz id-t az url-bol es betoltjuk
window.onload = function () {
  let kvizId = kvizIdAzUrlbol();
  if (kvizId) {
    betoltKviz(kvizId);
  } else {
    document.getElementById("kerdesekHely").innerHTML = "<p>Nincs megadva kviz.</p>";
  }
};

function kvizIdAzUrlbol() {
  let params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function betoltKviz(kvizId) {
  fetch("/api/quizzes/" + kvizId)
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (kviz) {
      aktualisKviz = kviz;
      kezdesIdopontja = Date.now();
      document.getElementById("kvizCim").innerText = kviz.title;
      document.getElementById("kvizLeiras").innerText = kviz.description || "";

      // idore meno es milliomos modnal egyesevel jonnek a kerdesek, idozitovel
      if (kviz.mode === "timed" || kviz.mode === "millionaire") {
        sorosIndex = 0;
        mutatSorosKerdest();
      } else {
        kirakKerdesek(kviz.kerdesek);
        document.getElementById("beadGomb").style.display = "inline-block";
      }
    })
    .catch(function () {
      document.getElementById("kerdesekHely").innerHTML = "<p>Hiba a kviz betolteskor.</p>";
    });
}

/* ===== KLASSZIKUS MOD ===== */

// kirakja egymas ala az osszes kerdest a valaszaikkal
function kirakKerdesek(kerdesek) {
  let hely = document.getElementById("kerdesekHely");
  hely.innerHTML = "";

  for (let i = 0; i < kerdesek.length; i++) {
    let k = kerdesek[i];

    let doboz = document.createElement("div");
    doboz.className = "kerdes-doboz";

    let cim = document.createElement("h3");
    cim.innerText = (i + 1) + ". " + k.question_text;
    doboz.appendChild(cim);

    for (let j = 0; j < k.valaszok.length; j++) {
      let v = k.valaszok[j];
      let gomb = document.createElement("button");
      gomb.className = "valasz-gomb";
      gomb.innerText = v.answer_text;
      gomb.setAttribute("data-kerdes", k.id);
      gomb.setAttribute("data-valasz", v.id);
      gomb.onclick = function () {
        valasztValaszt(k.id, v.id, doboz, gomb);
      };
      doboz.appendChild(gomb);
    }

    hely.appendChild(doboz);
  }
}

// elmentjuk a valasztott valaszt, es kiemeljuk a gombot
function valasztValaszt(kerdesId, valaszId, doboz, gomb) {
  kivalasztottValaszok[kerdesId] = valaszId;

  let gombok = doboz.getElementsByClassName("valasz-gomb");
  for (let i = 0; i < gombok.length; i++) {
    gombok[i].classList.remove("kivalasztva");
  }
  gomb.classList.add("kivalasztva");
}

function beadKviz() {
  let valaszok = [];
  for (let kerdesId in kivalasztottValaszok) {
    valaszok.push({
      questionId: parseInt(kerdesId),
      valasztottAnswerId: kivalasztottValaszok[kerdesId],
      ido: 0
    });
  }

  if (valaszok.length === 0) {
    alert("Valassz legalabb egy valaszt!");
    return;
  }

  let elteltMasodperc = Math.round((Date.now() - kezdesIdopontja) / 1000);
  beadas(valaszok, elteltMasodperc);
}

/* ===== IDORE MENO ES MILLIOMOS MOD (SOROS MEGJELENITES) ===== */

// mindig csak az aktualis kerdest rajzolja ki, es elinditja az idozitot
function mutatSorosKerdest() {
  // ha elfogytak a kerdesek, akkor beadjuk amit osszeszedtunk
  if (sorosIndex >= aktualisKviz.kerdesek.length) {
    let elteltMasodperc = Math.round((Date.now() - kezdesIdopontja) / 1000);
    beadas(sorosValaszok, elteltMasodperc);
    return;
  }

  let k = aktualisKviz.kerdesek[sorosIndex];
  let hely = document.getElementById("kerdesekHely");
  hely.innerHTML = "";

  let halado = document.createElement("p");
  halado.className = "halado-jelzo";
  halado.innerText = (sorosIndex + 1) + " / " + aktualisKviz.kerdesek.length + " kerdes";
  hely.appendChild(halado);

  let idoKijelzo = document.createElement("div");
  idoKijelzo.id = "idozitoKijelzo";
  idoKijelzo.className = "idozito";
  hely.appendChild(idoKijelzo);

  let doboz = document.createElement("div");
  doboz.className = "kerdes-doboz";

  let cim = document.createElement("h3");
  cim.innerText = k.question_text;
  doboz.appendChild(cim);

  for (let j = 0; j < k.valaszok.length; j++) {
    let v = k.valaszok[j];
    let gomb = document.createElement("button");
    gomb.className = "valasz-gomb";
    gomb.innerText = v.answer_text;
    gomb.id = "valasz-" + v.id;
    gomb.onclick = function () {
      sorosValaszAdas(v.id);
    };
    doboz.appendChild(gomb);
  }

  hely.appendChild(doboz);

  // ide keruli majd a kozonseg segitseg szazalekai
  let kozonsegHely = document.createElement("div");
  kozonsegHely.id = "kozonsegHely";
  hely.appendChild(kozonsegHely);

  if (aktualisKviz.mode === "millionaire") {
    kirakSegitsegGombokat(hely, k);
  }

  elinditIdozito();
}

// minden kerdesre 20 masodperc jar
function elinditIdozito() {
  idozitoMaradek = 20;
  frissitIdozitoKijelzo();

  if (idozitoTimer) {
    clearInterval(idozitoTimer);
  }

  idozitoTimer = setInterval(function () {
    idozitoMaradek = idozitoMaradek - 1;
    frissitIdozitoKijelzo();

    // ha lejart az ido, ugy vesszuk mintha nem valaszolt volna (null)
    if (idozitoMaradek <= 0) {
      clearInterval(idozitoTimer);
      sorosValaszAdas(null);
    }
  }, 1000);
}

function frissitIdozitoKijelzo() {
  let kijelzo = document.getElementById("idozitoKijelzo");
  if (kijelzo) {
    kijelzo.innerText = "Hatralevo ido: " + idozitoMaradek + " mp";
  }
}

// ez fut le amikor valaszolunk (vagy lejar az ido)
function sorosValaszAdas(valasztottAnswerId) {
  clearInterval(idozitoTimer);

  let aktKerdes = aktualisKviz.kerdesek[sorosIndex];

  sorosValaszok.push({
    questionId: aktKerdes.id,
    valasztottAnswerId: valasztottAnswerId,
    ido: idozitoMaradek
  });

  // milliomos modban a rossz valasz azonnal kiesest jelent,
  // ezert meg kell kerdeznunk a szervertol hogy jo volt-e
  if (aktualisKviz.mode === "millionaire") {
    fetch("/api/games/check-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: aktKerdes.id, valasztottAnswerId: valasztottAnswerId })
    })
      .then(function (v) {
        return v.json();
      })
      .then(function (eredmeny) {
        if (eredmeny.helyes === true) {
          sorosHelyesDb = sorosHelyesDb + 1;
          // minden 5. helyes valasznal szolunk hogy jar a bonusz
          if (sorosHelyesDb > 0 && sorosHelyesDb % 5 === 0) {
            alert("Mar " + sorosHelyesDb + " helyes valasznal jarsz, plusz xp bonuszt kaptal!");
          }
          sorosIndex = sorosIndex + 1;
          mutatSorosKerdest();
        } else {
          document.getElementById("kerdesekHely").innerHTML =
            "<div class='uzenet rossz'><h3>Kiestel!</h3><p>A(z) " + (sorosIndex + 1) + ". kerdesnel elrontottad a valaszt.</p></div>";
          let elteltMasodperc = Math.round((Date.now() - kezdesIdopontja) / 1000);
          beadas(sorosValaszok, elteltMasodperc);
        }
      });
  } else {
    // idore meno modban a rossz valasz nem jelent kiesest, csak megyunk tovabb
    sorosIndex = sorosIndex + 1;
    mutatSorosKerdest();
  }
}

/* ===== MILLIOMOS SEGITSEGEK ===== */

function kirakSegitsegGombokat(hely, kerdes) {
  let sav = document.createElement("div");
  sav.className = "segitseg-sav";

  let felezesGomb = document.createElement("button");
  felezesGomb.innerText = "Felezes";
  felezesGomb.disabled = felezesHasznalva;
  felezesGomb.onclick = function () {
    felezesHasznal(kerdes.id, felezesGomb);
  };
  sav.appendChild(felezesGomb);

  let kozonsegGomb = document.createElement("button");
  kozonsegGomb.innerText = "Kozonseg";
  kozonsegGomb.disabled = kozonsegHasznalva;
  kozonsegGomb.onclick = function () {
    kozonsegHasznal(kerdes.id, kozonsegGomb);
  };
  sav.appendChild(kozonsegGomb);

  let csereGomb = document.createElement("button");
  csereGomb.innerText = "Csere";
  csereGomb.disabled = csereHasznalva;
  csereGomb.onclick = function () {
    csereHasznal(kerdes.id, csereGomb);
  };
  sav.appendChild(csereGomb);

  hely.appendChild(sav);
}

// felezes: a szerver megmondja melyik ket rossz valaszt rejtsuk el
function felezesHasznal(questionId, gombElem) {
  if (felezesHasznalva) {
    return;
  }
  felezesHasznalva = true;
  gombElem.disabled = true;

  fetch("/api/games/hint/fifty-fifty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId: questionId })
  })
    .then(function (v) {
      return v.json();
    })
    .then(function (eredmeny) {
      if (eredmeny.elrejtendoValaszok) {
        for (let i = 0; i < eredmeny.elrejtendoValaszok.length; i++) {
          let gomb = document.getElementById("valasz-" + eredmeny.elrejtendoValaszok[i]);
          if (gomb) {
            gomb.style.display = "none";
          }
        }
      }
    });
}

// kozonseg: kiirjuk a valaszok ala hogy hany szazalek szavazott rajuk
function kozonsegHasznal(questionId, gombElem) {
  if (kozonsegHasznalva) {
    return;
  }
  kozonsegHasznalva = true;
  gombElem.disabled = true;

  fetch("/api/games/hint/audience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId: questionId })
  })
    .then(function (v) {
      return v.json();
    })
    .then(function (eredmeny) {
      let kozonsegHely = document.getElementById("kozonsegHely");
      if (!eredmeny.szazalekok || !kozonsegHely) {
        return;
      }
      let szoveg = "<div class='kozonseg-sav'>";
      for (let valaszId in eredmeny.szazalekok) {
        let gomb = document.getElementById("valasz-" + valaszId);
        let cimke = valaszId;
        if (gomb) {
          cimke = gomb.innerText;
        }
        szoveg = szoveg + "<p>" + cimke + ": " + eredmeny.szazalekok[valaszId] + "%</p>";
      }
      szoveg = szoveg + "</div>";
      kozonsegHely.innerHTML = szoveg;
    });
}

// csere: masik, azonos nehezsegu kerdest kerunk a szervertol
function csereHasznal(questionId, gombElem) {
  if (csereHasznalva) {
    return;
  }

  fetch("/api/games/hint/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizId: aktualisKviz.id, questionId: questionId })
  })
    .then(function (v) {
      return v.json();
    })
    .then(function (ujKerdes) {
      // ha nincs tobb cserelheto kerdes, akkor szolunk es marad a regi
      if (ujKerdes.hiba) {
        alert(ujKerdes.hiba);
        return;
      }
      csereHasznalva = true;
      gombElem.disabled = true;
      aktualisKviz.kerdesek[sorosIndex] = ujKerdes;
      mutatSorosKerdest();
    });
}

/* ===== KOZOS BEADAS ===== */

// ez kuldi el a valaszokat a szervernek, mindharom modnal ugyanez fut
function beadas(valaszok, elteltMasodperc) {
  let adat = { quizId: aktualisKviz.id, valaszok: valaszok, elteltMasodperc: elteltMasodperc };

  fetch("/api/games/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adat)
  })
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (eredmeny) {
      if (eredmeny.hiba) {
        document.getElementById("eredmenyHely").innerHTML =
          "<div class='uzenet rossz'>" + eredmeny.hiba + "</div>";
      } else {
        mutatEredmeny(eredmeny);
      }
    });
}

function mutatEredmeny(e) {
  let szoveg =
    "<div class='uzenet jo'>" +
    "<h3>Eredmeny</h3>" +
    "<p>Helyes valaszok: " + e.helyesValaszok + " / " + e.osszKerdes + "</p>" +
    "<p>Szerzett pont: " + e.osszPont + "</p>" +
    "<p>Kapott xp: " + e.kapottXp + "</p>" +
    "<p>Osszes xp most: " + e.ujOsszesXp + "</p>" +
    "<p>Jelenlegi szint: " + e.ujSzint + "</p>";

  if (e.nyert === true) {
    szoveg = szoveg + "<p><b>Gratulalok, nyertel!</b></p>";
  } else {
    szoveg = szoveg + "<p>Legkozelebb tobb helyes valasz kell a gyozelemhez.</p>";
  }

  szoveg = szoveg + "</div>";

  document.getElementById("eredmenyHely").innerHTML = szoveg;

  let beadGomb = document.getElementById("beadGomb");
  if (beadGomb) {
    beadGomb.style.display = "none";
  }
}
