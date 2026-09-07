// ez a fofajl, ez inditja el a szervert
// itt allitjuk be az expresst es itt kotjuk be az utvonalakat

const express = require("express");
const session = require("express-session");
const path = require("path");

// behivjuk a kulonbozo utvonal fajlokat
const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/questions");
const quizRoutes = require("./routes/quizzes");
const gameRoutes = require("./routes/games");
const leaderboardRoutes = require("./routes/leaderboard");
const userRoutes = require("./routes/users");

const app = express();
const PORT = 3000;

// ezzel tudjuk olvasni a json body-t amit a frontend kuld
app.use(express.json());

// beallitjuk a session-t, ez tarolja hogy ki van bejelentkezve
app.use(session({
  secret: "quizarena-titkos-kulcs-ezt-eleskorra-cserelni-kell",
  resave: false,
  saveUninitialized: false
}));

// a public mappat kiszolgaljuk statikusan (html, css, js)
app.use(express.static(path.join(__dirname, "..", "public")));

// bekotjuk az api utvonalakat, mindegyik sajat elotaggal
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/users", userRoutes);

// elinditjuk a szervert
app.listen(PORT, function () {
  console.log("a quizarena szerver fut itt: http://localhost:" + PORT);
});
