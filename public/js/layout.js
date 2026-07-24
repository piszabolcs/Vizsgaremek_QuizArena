// ez a fajl fut le minden oldalon eloszor
// beszurja a navbart es a belepo/regisztracios modalt, es ellenorzi a bejelentkezest

// azokon az oldalakon, ahol bejelentkezes kell, ha nincs bejelentkezve, ide iranyitunk vissza
const BEJELENTKEZES_KELL = document.body.getAttribute("data-vedett") === "igen";

function navbarBeszuras(bejelentkezve) {
  let linkekHtml = "";

  if (bejelentkezve) {
    linkekHtml =
      '<a href="games.html">Játékok</a>' +
      '<a href="leaderboard.html">Ranglista</a>' +
      '<a href="profile.html">Profil</a>' +
      '<button onclick="kijelentkezesFut()">Kijelentkezés</button>';
  } else {
    linkekHtml =
      '<button onclick="modalMegnyitas(\'login\')">Belépés</button>' +
      '<button onclick="modalMegnyitas(\'register\')">Regisztráció</button>';
  }

  const navbarHtml =
    '<nav class="navbar">' +
    '<a class="navbar-brand" href="index.html"><img src="/logo.png" alt="QuizArena logó">QuizArena</a>' +
    '<button class="hamburger" onclick="hamburgerValtas()">☰</button>' +
    '<div class="navbar-links" id="navbarLinkek">' + linkekHtml + "</div>" +
    "</nav>";

  document.body.insertAdjacentHTML("afterbegin", navbarHtml);
}

function hamburgerValtas() {
  document.getElementById("navbarLinkek").classList.toggle("nyitva");
}

function modalBeszuras() {
  const modalHtml =
    '<dialog id="authModal">' +
    '<button class="modal-bezar" onclick="modalBezaras()">✕</button>' +
    '<div class="modal-valto">' +
    '<button id="modalLoginFul" onclick="modalFulValtas(\'login\')">Belépés</button>' +
    '<button id="modalRegFul" onclick="modalFulValtas(\'register\')">Regisztráció</button>' +
    "</div>" +
    '<div id="modalUzenet"></div>' +
    '<div id="modalLoginUrlap">' +
    '<input type="email" id="modalLoginEmail" placeholder="email cím">' +
    '<input type="password" id="modalLoginJelszo" placeholder="jelszó">' +
    '<button onclick="belepesFut()">Belépek</button>' +
    "</div>" +
    '<div id="modalRegUrlap" style="display:none;">' +
    '<input type="text" id="modalRegUsername" placeholder="felhasználónév">' +
    '<input type="email" id="modalRegEmail" placeholder="email cím">' +
    '<input type="password" id="modalRegJelszo" placeholder="jelszó">' +
    '<button onclick="regisztracioFut()">Regisztrálok</button>' +
    "</div>" +
    "</dialog>";

  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function modalMegnyitas(melyikFul) {
  modalFulValtas(melyikFul);
  document.getElementById("authModal").showModal();
}

function modalBezaras() {
  document.getElementById("authModal").close();
}

function modalFulValtas(melyikFul) {
  const loginUrlap = document.getElementById("modalLoginUrlap");
  const regUrlap = document.getElementById("modalRegUrlap");
  const loginFul = document.getElementById("modalLoginFul");
  const regFul = document.getElementById("modalRegFul");

  if (melyikFul === "login") {
    loginUrlap.style.display = "block";
    regUrlap.style.display = "none";
    loginFul.classList.add("aktiv");
    regFul.classList.remove("aktiv");
  } else {
    loginUrlap.style.display = "none";
    regUrlap.style.display = "block";
    loginFul.classList.remove("aktiv");
    regFul.classList.add("aktiv");
  }
}

function modalUzenetKiiras(szoveg, joE) {
  let osztaly = "rossz";
  if (joE === true) {
    osztaly = "jo";
  }
  document.getElementById("modalUzenet").innerHTML =
    "<div class='uzenet " + osztaly + "'>" + szoveg + "</div>";
}

function belepesFut() {
  const email = document.getElementById("modalLoginEmail").value;
  const jelszo = document.getElementById("modalLoginJelszo").value;

  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, jelszo: jelszo })
  })
    .then(function (v) { return v.json(); })
    .then(function (eredmeny) {
      if (eredmeny.hiba) {
        modalUzenetKiiras(eredmeny.hiba, false);
      } else {
        window.location.href = "games.html";
      }
    });
}

function regisztracioFut() {
  const username = document.getElementById("modalRegUsername").value;
  const email = document.getElementById("modalRegEmail").value;
  const jelszo = document.getElementById("modalRegJelszo").value;

  fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username, email: email, jelszo: jelszo })
  })
    .then(function (v) { return v.json(); })
    .then(function (eredmeny) {
      if (eredmeny.hiba) {
        modalUzenetKiiras(eredmeny.hiba, false);
      } else {
        modalUzenetKiiras("Sikeres regisztráció! Most már be tudsz jelentkezni.", true);
        modalFulValtas("login");
      }
    });
}

function kijelentkezesFut() {
  fetch("/api/auth/logout", { method: "POST" })
    .then(function () {
      window.location.href = "index.html";
    });
}

// oldal-inditaskor lekerdezzuk hogy be vagyunk-e jelentkezve, es ez alapjan epitjuk fel a navbart
function oldalKeretInditas() {
  modalBeszuras();

  fetch("/api/users/me")
    .then(function (valasz) {
      if (valasz.status === 200) {
        return valasz.json();
      }
      return null;
    })
    .then(function (user) {
      if (user) {
        navbarBeszuras(true);
      } else {
        navbarBeszuras(false);
        if (BEJELENTKEZES_KELL) {
          window.location.href = "index.html";
        }
      }
    });
}

oldalKeretInditas();
