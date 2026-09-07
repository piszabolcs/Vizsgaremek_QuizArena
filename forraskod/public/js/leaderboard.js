// ez a ranglista oldal logikaja
// lekeri a top jatekosokat es kirakja egy tablazatba

window.onload = function () {
  betoltRanglista();
};

function betoltRanglista() {
  fetch("/api/leaderboard")
    .then(function (valasz) {
      return valasz.json();
    })
    .then(function (lista) {
      let hely = document.getElementById("ranglistaHely");

      if (lista.length === 0) {
        hely.innerHTML = "<p>Meg nincs egy jatekos sem a ranglistan.</p>";
        return;
      }

      // felepitjuk a tablazatot sorrol sorra
      let html = "<table>";
      html = html + "<tr><th>Helyezes</th><th>Jatekos</th><th>Szint</th><th>XP</th><th>Gyozelmek</th></tr>";

      for (let i = 0; i < lista.length; i++) {
        let j = lista[i];
        html = html +
          "<tr>" +
          "<td>" + j.helyezes + "</td>" +
          "<td>" + j.username + "</td>" +
          "<td>" + j.szint + "</td>" +
          "<td>" + j.xp + "</td>" +
          "<td>" + j.total_wins + "</td>" +
          "</tr>";
      }

      html = html + "</table>";
      hely.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("ranglistaHely").innerHTML = "<p>Hiba a betolteskor.</p>";
    });
}
