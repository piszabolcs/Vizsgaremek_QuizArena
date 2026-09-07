// ez a jatekok oldal logikaja
// lekeri a kvizeket a szervertol es kirakja oket a kepernyore

window.onload = function () {
  betoltKvizek();
  udvozlesKiiras();
};

function betoltKvizek() {
  fetch("/api/quizzes")
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (kvizek) {
      let hely = document.getElementById("kvizLista");
      hely.innerHTML = "";

      if (kvizek.length === 0) {
        hely.innerHTML = "<p>Meg nincs egy kviz sem.</p>";
        return;
      }

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

function jatszani(kvizId) {
  window.location.href = "quiz.html?id=" + kvizId;
}

function udvozlesKiiras() {
  fetch("/api/users/me")
    .then(function (valasz) {
      if (valasz.status === 200) {
        return valasz.json();
      }
      return null;
    })
    .then(function (user) {
      if (user) {
        document.getElementById("udvozles").innerHTML =
          "<div class='uzenet jo'>Szia " + user.username + "! Jelenlegi xp-d: " + user.xp + "</div>";
      }
    });
}
