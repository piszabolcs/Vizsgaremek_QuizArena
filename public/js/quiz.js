// ez a kviz kitolto oldal logikaja
// betolti a kerdeseket, hagyja hogy valasszunk, majd beadja a valaszokat

// ebben taroljuk a kviz adatait miutan betoltottuk
let aktualisKviz = null;

// ebben taroljuk hogy melyik kerdesre melyik valaszt valasztottuk
// pl { 12: 45 }  ->  a 12-es kerdesre a 45-os valaszt valasztottuk
let kivalasztottValaszok = {};

// amikor betolt az oldal, kiolvassuk a kviz id-t az url-bol es betoltjuk
window.onload = function () {
  let kvizId = kvizIdAzUrlbol();
  if (kvizId) {
    betoltKviz(kvizId);
  } else {
    document.getElementById("kerdesekHely").innerHTML = "<p>Nincs megadva kviz.</p>";
  }
};

// kiolvassuk a ?id=... reszt az url-bol
function kvizIdAzUrlbol() {
  let params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// betoltjuk a kvizt es kirakjuk a kerdeseket
function betoltKviz(kvizId) {
  fetch("/api/quizzes/" + kvizId)
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (kviz) {
      aktualisKviz = kviz;
      document.getElementById("kvizCim").innerText = kviz.title;
      document.getElementById("kvizLeiras").innerText = kviz.description || "";
      kirakKerdesek(kviz.kerdesek);
      // most mar latszodhat a bead gomb
      document.getElementById("beadGomb").style.display = "inline-block";
    })
    .catch(function () {
      document.getElementById("kerdesekHely").innerHTML = "<p>Hiba a kviz betolteskor.</p>";
    });
}

// kirakja az osszes kerdest a valaszokkal egyutt
function kirakKerdesek(kerdesek) {
  let hely = document.getElementById("kerdesekHely");
  hely.innerHTML = "";

  for (let i = 0; i < kerdesek.length; i++) {
    let k = kerdesek[i];

    // csinalunk egy dobozt a kerdesnek
    let doboz = document.createElement("div");
    doboz.className = "kerdes-doboz";

    // a kerdes szovege
    let cim = document.createElement("h3");
    cim.innerText = (i + 1) + ". " + k.question_text;
    doboz.appendChild(cim);

    // a valasz gombok
    for (let j = 0; j < k.valaszok.length; j++) {
      let v = k.valaszok[j];
      let gomb = document.createElement("button");
      gomb.className = "valasz-gomb";
      gomb.innerText = v.answer_text;

      // amikor rakattintunk, elmentjuk a valasztast
      // hasznalunk egy kis trukkot hogy a jo id-k benne legyenek
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

// amikor kivalasztunk egy valaszt
function valasztValaszt(kerdesId, valaszId, doboz, gomb) {
  // elmentjuk melyik valaszt valasztottuk erre a kerdesre
  kivalasztottValaszok[kerdesId] = valaszId;

  // levesszuk a kiemelest a doboz osszes gombjarol
  let gombok = doboz.getElementsByClassName("valasz-gomb");
  for (let i = 0; i < gombok.length; i++) {
    gombok[i].classList.remove("kivalasztva");
  }

  // es kiemeljuk azt amit most valasztottunk
  gomb.classList.add("kivalasztva");
}

// beadjuk a valaszokat a szervernek
function beadKviz() {
  // osszerakjuk a valaszok tombot abbol amit kivalasztottunk
  let valaszok = [];
  for (let kerdesId in kivalasztottValaszok) {
    valaszok.push({
      questionId: parseInt(kerdesId),
      valasztottAnswerId: kivalasztottValaszok[kerdesId],
      ido: 0
    });
  }

  // ha nem valaszoltunk semmire akkor szolunk
  if (valaszok.length === 0) {
    alert("Valassz legalabb egy valaszt!");
    return;
  }

  let adat = { quizId: aktualisKviz.id, valaszok: valaszok };

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

// kiirja az eredmenyt a beadas utan
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

  // elrejtjuk a bead gombot hogy ne lehessen ketszer beadni
  document.getElementById("beadGomb").style.display = "none";
}
