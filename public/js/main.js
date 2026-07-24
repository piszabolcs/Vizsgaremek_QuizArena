// ez a fooldal logikaja
// lekeri a kvizeket a szervertol es kirakja oket a kepernyore

// amikor betolt az oldal, lekerjuk a kvizeket
window.onload = function () {
  betoltKvizek();
  megnezKiVanBent();
};

// lekerjuk a kvizek listajat az api-tol
function betoltKvizek() {
  fetch("/api/quizzes")
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (kvizek) {
      let hely = document.getElementById("kvizLista");
      hely.innerHTML = "";

      // ha nincs egy kviz sem
      if (kvizek.length === 0) {
        hely.innerHTML = "<p>Meg nincs egy kviz sem.</p>";
        return;
      }

      // vegigmegyunk a kvizeken es mindegyikbol csinalunk egy dobozt
      for (let i = 0; i < kvizek.length; i++) {
        let k = kvizek[i];
        let doboz = document.createElement("div");
        doboz.className = "kviz-doboz";
        doboz.innerHTML =
          "<h3>" + k.title + "</h3>" +
          "<p>" + (k.description || "") + "</p>" +
          "<p><small>Mod: " + k.mode + " | Keszito: " + k.keszito + "</small></p>" +
          "<button onclick=\"jatszani(" + k.id + ")\">Kitoltom</button>";
        hely.appendChild(doboz);
      }
    })
    .catch(function () {
      document.getElementById("kvizLista").innerHTML = "<p>Hiba a betolteskor.</p>";
    });
}

// ha rakattint egy kvizre akkor atmegyunk a jatek oldalra
function jatszani(kvizId) {
  window.location.href = "quiz.html?id=" + kvizId;
}

// megnezzuk hogy be van-e valaki jelentkezve es kiirjuk a nevet
function megnezKiVanBent() {
  fetch("/api/users/me")
    .then(function (valasz) {
      if (valasz.status === 200) {
        return valasz.json();
      } else {
        return null;
      }
    })
    .then(function (user) {
      if (user) {
        document.getElementById("udvozles").innerHTML =
          "<div class='uzenet jo'>Szia " + user.username + "! Jelenlegi xp-d: " + user.xp + "</div>";
      }
    });
}
