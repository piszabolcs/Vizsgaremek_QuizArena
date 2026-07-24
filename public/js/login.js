// ez a belepes oldal logikaja
// itt van a bejelentkezes, regisztracio es kijelentkezes

// egy kis segedfuggveny hogy uzenetet irjunk ki a kepernyore
function uzenetKiiras(szoveg, joE) {
  let hely = document.getElementById("uzenetHely");
  let osztaly = "rossz";
  if (joE === true) {
    osztaly = "jo";
  }
  hely.innerHTML = "<div class='uzenet " + osztaly + "'>" + szoveg + "</div>";
}

// BEJELENTKEZES
function bejelentkezes() {
  let email = document.getElementById("loginEmail").value;
  let jelszo = document.getElementById("loginJelszo").value;

  // osszerakjuk az adatokat amit elkuldunk
  let adat = { email: email, jelszo: jelszo };

  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adat)
  })
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (eredmeny) {
      if (eredmeny.hiba) {
        uzenetKiiras(eredmeny.hiba, false);
      } else {
        uzenetKiiras("Sikeres belepes! Udv " + eredmeny.username, true);
      }
    });
}

// REGISZTRACIO
function regisztracio() {
  let username = document.getElementById("regUsername").value;
  let email = document.getElementById("regEmail").value;
  let jelszo = document.getElementById("regJelszo").value;

  let adat = { username: username, email: email, jelszo: jelszo };

  fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adat)
  })
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (eredmeny) {
      if (eredmeny.hiba) {
        uzenetKiiras(eredmeny.hiba, false);
      } else {
        uzenetKiiras("Sikeres regisztracio! Most mar be tudsz jelentkezni.", true);
      }
    });
}

// KIJELENTKEZES
function kijelentkezes() {
  fetch("/api/auth/logout", { method: "POST" })
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function () {
      uzenetKiiras("Kijelentkeztel.", true);
    });
}
