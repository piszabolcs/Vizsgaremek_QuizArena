// ez a profil oldal logikaja
// lekeri a bejelentkezett felhasznalo adatait, eredmenyeit es sajat kvizeit

window.onload = function () {
  betoltProfil();
  betoltEredmenyek();
  betoltSajatKvizek();
};

// lekerjuk a felhasznalo alap adatait
function betoltProfil() {
  fetch("/api/users/me")
    .then(function (valasz) {
      if (valasz.status === 401) {
        // ha nincs bejelentkezve
        // (a layout.js amugy is visszairanyit a fooldalra, ez csak biztos ami biztos)
        document.getElementById("profilHely").innerHTML =
          "<div class='uzenet rossz'>Ehhez be kell jelentkezni. <a href='index.html'>Fooldal</a></div>";
        return null;
      }
      return valasz.json();
    })
    .then(function (user) {
      if (!user) {
        return;
      }
      document.getElementById("profilHely").innerHTML =
        "<div class='uzenet jo'>" +
        "<p><b>Felhasznalonev:</b> " + user.username + "</p>" +
        "<p><b>Email:</b> " + user.email + "</p>" +
        "<p><b>Szint:</b> " + user.szint + " (" + user.level_number + ". szint)</p>" +
        "<p><b>XP:</b> " + user.xp + "</p>" +
        "<p><b>Gyozelmek:</b> " + user.total_wins + " / " + user.total_games + " jatek</p>" +
        "</div>";
    });
}

// lekerjuk a korabbi eredmenyeket
function betoltEredmenyek() {
  fetch("/api/users/me/results")
    .then(function (valasz) {
      if (valasz.status === 401) {
        return null;
      }
      return valasz.json();
    })
    .then(function (eredmenyek) {
      if (!eredmenyek) {
        return;
      }
      let hely = document.getElementById("eredmenyekHely");

      if (eredmenyek.length === 0) {
        hely.innerHTML = "<p>Meg nincs egy kitoltott kviz sem.</p>";
        return;
      }

      let html = "<table><tr><th>Kviz</th><th>Pont</th><th>Helyes</th><th>Ido</th><th>Datum</th></tr>";
      for (let i = 0; i < eredmenyek.length; i++) {
        let e = eredmenyek[i];
        let idoSzoveg = "-";
        if (e.time_spent) {
          idoSzoveg = e.time_spent + " mp";
        }
        html = html +
          "<tr>" +
          "<td>" + e.kviz + "</td>" +
          "<td>" + e.score + "</td>" +
          "<td>" + e.correct_count + "</td>" +
          "<td>" + idoSzoveg + "</td>" +
          "<td>" + e.played_at + "</td>" +
          "</tr>";
      }
      html = html + "</table>";
      hely.innerHTML = html;
    });
}

// lekerjuk a sajat mentett kvizeket
function betoltSajatKvizek() {
  fetch("/api/users/me/quizzes")
    .then(function (valasz) {
      if (valasz.status === 401) {
        return null;
      }
      return valasz.json();
    })
    .then(function (kvizek) {
      if (!kvizek) {
        return;
      }
      let hely = document.getElementById("sajatKvizekHely");

      if (kvizek.length === 0) {
        hely.innerHTML = "<p>Meg nem mentettel el sajat kvizt.</p>";
        return;
      }

      let html = "";
      for (let i = 0; i < kvizek.length; i++) {
        let k = kvizek[i];
        html = html +
          "<div class='kviz-doboz'>" +
          "<h3>" + k.title + "</h3>" +
          "<p>" + (k.description || "") + "</p>" +
          "<p><small>Mod: " + k.mode + "</small></p>" +
          "</div>";
      }
      hely.innerHTML = html;
    });
}
