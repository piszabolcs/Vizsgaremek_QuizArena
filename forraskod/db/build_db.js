// ez a szkript ujraepiti az sqlite adatbazist nullarol
// futtatas: npm run seed
// figyelem: ez torli a regi quizarena.db-t es ujat csinal!

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Database = require("better-sqlite3");

// megkeressuk hova kell a db file
const dbFile = path.join(__dirname, "quizarena.db");

// ha mar letezik akkor toroljuk hogy tisztan induljunk
if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
  console.log("regi adatbazis torolve");
}

const db = new Database(dbFile);
db.pragma("foreign_keys = ON");

// kis segedfuggveny a jelszo hasheléshez
function jelszoHash(jelszo) {
  return crypto.createHash("sha256").update(jelszo).digest("hex");
}

// LETREHOZZUK A TABLAKAT
// ez ugyanaz mint a schema.sql, csak itt sqlite valtozatban
db.exec(`
CREATE TABLE levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level_number INTEGER NOT NULL UNIQUE,
  xp_required INTEGER NOT NULL,
  title TEXT NOT NULL
);
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level_id INTEGER DEFAULT 1,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'player',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (level_id) REFERENCES levels(id)
);
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  question_text TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  created_by INTEGER,
  is_public INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
CREATE TABLE quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL,
  mode TEXT DEFAULT 'classic',
  is_public INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);
CREATE TABLE game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  host_id INTEGER NOT NULL,
  mode TEXT DEFAULT 'solo',
  status TEXT DEFAULT 'waiting',
  started_at TEXT,
  ended_at TEXT,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (host_id) REFERENCES users(id)
);
CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);
CREATE TABLE session_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  team_id INTEGER,
  score INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  placement INTEGER,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);
CREATE TABLE results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quiz_id INTEGER NOT NULL,
  session_id INTEGER,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  time_spent INTEGER,
  played_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (session_id) REFERENCES game_sessions(id)
);
`);
console.log("tablak letrehozva");

// FELTOLTJUK A SZINTEKET
const szintBeszuro = db.prepare("INSERT INTO levels (level_number, xp_required, title) VALUES (?, ?, ?)");
szintBeszuro.run(1, 0, "Újonc");
szintBeszuro.run(2, 100, "Kezdő");
szintBeszuro.run(3, 300, "Haladó");
szintBeszuro.run(4, 600, "Rutinos");
szintBeszuro.run(5, 1000, "Profi");
szintBeszuro.run(6, 1600, "Mester");
szintBeszuro.run(7, 2500, "Kvízmester");

// FELTOLTJUK A KATEGORIAKAT
const katBeszuro = db.prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
katBeszuro.run("Történelem", "Magyar és egyetemes történelmi kérdések");
katBeszuro.run("Földrajz", "Országok, fővárosok, folyók, hegyek");
katBeszuro.run("Tudomány", "Fizika, kémia, biológia, matematika");
katBeszuro.run("Sport", "Olimpia, labdarúgás, rekordok");
katBeszuro.run("Film és sorozat", "Filmek, rendezők, színészek");
katBeszuro.run("Zene", "Zenetörténet, előadók, hangszerek");
katBeszuro.run("Irodalom", "Magyar és világirodalom");
katBeszuro.run("Technika és informatika", "Számítástechnika, találmányok");
katBeszuro.run("Művészet", "Festészet, építészet, szobrászat");
katBeszuro.run("Általános műveltség", "Vegyes, mindenféle témából");

// FELTOLTUNK NEHANY MINTA FELHASZNALOT
const userBeszuro = db.prepare("INSERT INTO users (username, email, password_hash, xp, level_id, total_wins, total_games, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
userBeszuro.run("admin", "admin@quizarena.hu", jelszoHash("admin123"), 2600, 7, 40, 60, "admin");
userBeszuro.run("kvizmester", "host@quizarena.hu", jelszoHash("host123"), 1200, 5, 25, 45, "host");
userBeszuro.run("jatekos1", "anna@example.com", jelszoHash("jelszo1"), 350, 3, 8, 20, "player");
userBeszuro.run("jatekos2", "bela@example.com", jelszoHash("jelszo2"), 120, 2, 3, 12, "player");
userBeszuro.run("ujonc", "cili@example.com", jelszoHash("jelszo3"), 30, 1, 0, 4, "player");

// FELTOLTJUK A KERDESEKET ES A VALASZOKAT
// a kerdesek egy nagy tombben vannak, minden elem tartalmazza a valaszokat is
const pontTabla = { easy: 10, medium: 20, hard: 30 };
const kerdesek = [
  { cat: 1, diff: "easy", q: "Melyik évben alapították a Magyar Államot Szent István koronázásával?", answers: ["1000", "1241", "1526", "896"], correct: 0 },
  { cat: 1, diff: "easy", q: "Ki volt az első magyar király?", answers: ["Szent István", "Szent László", "Könyves Kálmán", "Álmos"], correct: 0 },
  { cat: 1, diff: "easy", q: "Melyik évben tört ki az 1848–49-es magyar forradalom?", answers: ["1848", "1789", "1914", "1956"], correct: 0 },
  { cat: 1, diff: "medium", q: "Melyik csatában szenvedett vereséget a magyar sereg 1526-ban?", answers: ["Mohácsi csata", "Muhi csata", "Nándorfehérvári ostrom", "Pozsonyi csata"], correct: 0 },
  { cat: 1, diff: "medium", q: "Ki volt a Magyar Köztársaság első elnöke 1946-ban?", answers: ["Tildy Zoltán", "Nagy Imre", "Kádár János", "Horthy Miklós"], correct: 0 },
  { cat: 1, diff: "medium", q: "Melyik évben zajlott a tatárjárás Magyarországon?", answers: ["1241", "1301", "1456", "1000"], correct: 0 },
  { cat: 1, diff: "hard", q: "Melyik békeszerződés zárta le Magyarország számára az első világháborút?", answers: ["Trianoni békeszerződés", "Párizsi béke", "Versailles-i béke", "Westfáliai béke"], correct: 0 },
  { cat: 1, diff: "hard", q: "Ki vezette a Rákóczi-szabadságharcot 1703 és 1711 között?", answers: ["II. Rákóczi Ferenc", "Bocskai István", "Thököly Imre", "Bethlen Gábor"], correct: 0 },
  { cat: 1, diff: "hard", q: "Melyik évben esett el Buda a török ostrom során, majd lett vissza 1686-ban?", answers: ["1541", "1526", "1699", "1568"], correct: 0 },
  { cat: 2, diff: "easy", q: "Mi Magyarország fővárosa?", answers: ["Budapest", "Debrecen", "Szeged", "Győr"], correct: 0 },
  { cat: 2, diff: "easy", q: "Melyik a leghosszabb folyó Magyarországon?", answers: ["Tisza", "Duna", "Dráva", "Rába"], correct: 0 },
  { cat: 2, diff: "easy", q: "Melyik kontinensen található Egyiptom?", answers: ["Afrika", "Ázsia", "Európa", "Dél-Amerika"], correct: 0 },
  { cat: 2, diff: "medium", q: "Mi Ausztrália fővárosa?", answers: ["Canberra", "Sydney", "Melbourne", "Perth"], correct: 0 },
  { cat: 2, diff: "medium", q: "Melyik a Föld legnagyobb óceánja?", answers: ["Csendes-óceán", "Atlanti-óceán", "Indiai-óceán", "Jeges-tenger"], correct: 0 },
  { cat: 2, diff: "medium", q: "Melyik ország fővárosa Ottawa?", answers: ["Kanada", "Ausztrália", "Új-Zéland", "USA"], correct: 0 },
  { cat: 2, diff: "hard", q: "Melyik a világ legmagasabb hegycsúcsa?", answers: ["Mount Everest", "K2", "Kilimandzsáró", "Mont Blanc"], correct: 0 },
  { cat: 2, diff: "hard", q: "Melyik ország területe a legnagyobb a világon?", answers: ["Oroszország", "Kanada", "Kína", "USA"], correct: 0 },
  { cat: 2, diff: "hard", q: "Melyik afrikai ország fővárosa Nairobi?", answers: ["Kenya", "Tanzánia", "Uganda", "Etiópia"], correct: 0 },
  { cat: 3, diff: "easy", q: "Mi a víz kémiai képlete?", answers: ["H2O", "CO2", "O2", "NaCl"], correct: 0 },
  { cat: 3, diff: "easy", q: "Hány lába van egy rovarnak?", answers: ["6", "8", "4", "10"], correct: 0 },
  { cat: 3, diff: "easy", q: "Melyik bolygó van legközelebb a Naphoz?", answers: ["Merkúr", "Vénusz", "Föld", "Mars"], correct: 0 },
  { cat: 3, diff: "medium", q: "Mi az emberi test legnagyobb szerve?", answers: ["A bőr", "A máj", "A tüdő", "A szív"], correct: 0 },
  { cat: 3, diff: "medium", q: "Melyik gáz teszi ki a Föld légkörének legnagyobb részét?", answers: ["Nitrogén", "Oxigén", "Szén-dioxid", "Hidrogén"], correct: 0 },
  { cat: 3, diff: "medium", q: "Ki dolgozta ki a relativitáselméletet?", answers: ["Albert Einstein", "Isaac Newton", "Nikola Tesla", "Galilei"], correct: 0 },
  { cat: 3, diff: "hard", q: "Mi a fénysebesség vákuumban közelítőleg?", answers: ["300 000 km/s", "150 000 km/s", "1 000 km/s", "30 000 km/s"], correct: 0 },
  { cat: 3, diff: "hard", q: "Melyik kémiai elem vegyjele az 'Au'?", answers: ["Arany", "Ezüst", "Alumínium", "Argon"], correct: 0 },
  { cat: 3, diff: "hard", q: "Hány kromoszómája van egy egészséges embernek?", answers: ["46", "23", "48", "44"], correct: 0 },
  { cat: 4, diff: "easy", q: "Hány játékos van egy focicsapatban a pályán egyszerre?", answers: ["11", "9", "7", "13"], correct: 0 },
  { cat: 4, diff: "easy", q: "Melyik sportághoz kötődik a Wimbledon?", answers: ["Tenisz", "Golf", "Krikett", "Úszás"], correct: 0 },
  { cat: 4, diff: "easy", q: "Milyen színű a szumó küzdőtér határvonala hagyományosan?", answers: ["Fehér", "Piros", "Fekete", "Kék"], correct: 0 },
  { cat: 4, diff: "medium", q: "Hány évente rendezik a nyári olimpiai játékokat?", answers: ["4 évente", "2 évente", "3 évente", "5 évente"], correct: 0 },
  { cat: 4, diff: "medium", q: "Melyik országból származik a judo sportág?", answers: ["Japán", "Kína", "Korea", "Thaiföld"], correct: 0 },
  { cat: 4, diff: "medium", q: "Ki nyerte a legtöbb Forma-1 világbajnoki címet (7-tel megosztva)?", answers: ["Lewis Hamilton", "Ayrton Senna", "Niki Lauda", "Sebastian Vettel"], correct: 0 },
  { cat: 4, diff: "hard", q: "Melyik évben rendeztek először modern kori olimpiát?", answers: ["1896", "1900", "1924", "1888"], correct: 0 },
  { cat: 4, diff: "hard", q: "Hány gyűrű látható az olimpiai zászlón?", answers: ["5", "4", "6", "3"], correct: 0 },
  { cat: 4, diff: "hard", q: "Melyik magyar úszó nyert három aranyérmet a 2016-os riói olimpián?", answers: ["Hosszú Katinka", "Cseh László", "Gyurta Dániel", "Kapás Boglárka"], correct: 0 },
  { cat: 5, diff: "easy", q: "Melyik animációs stúdió készítette az Oroszlánkirályt?", answers: ["Disney", "Pixar", "DreamWorks", "Studio Ghibli"], correct: 0 },
  { cat: 5, diff: "easy", q: "Ki játssza a Vasembert a Marvel-filmekben?", answers: ["Robert Downey Jr.", "Chris Evans", "Chris Hemsworth", "Mark Ruffalo"], correct: 0 },
  { cat: 5, diff: "medium", q: "Ki rendezte a Titanic című filmet?", answers: ["James Cameron", "Steven Spielberg", "Christopher Nolan", "Ridley Scott"], correct: 0 },
  { cat: 5, diff: "medium", q: "Melyik filmben hangzik el a 'Az erő legyen veled!' mondat?", answers: ["Csillagok háborúja", "Star Trek", "Alien", "Blade Runner"], correct: 0 },
  { cat: 5, diff: "medium", q: "Melyik sorozat játszódik Westeros kontinensén?", answers: ["Trónok harca", "The Witcher", "Vikingek", "Rómaiak"], correct: 0 },
  { cat: 5, diff: "hard", q: "Melyik film nyerte el a legjobb film Oscar-díját 2020-ban?", answers: ["Élősködők (Parasite)", "1917", "Joker", "Volt egyszer egy Hollywood"], correct: 0 },
  { cat: 5, diff: "hard", q: "Ki rendezte az Eredet (Inception) című filmet?", answers: ["Christopher Nolan", "Denis Villeneuve", "David Fincher", "Quentin Tarantino"], correct: 0 },
  { cat: 6, diff: "easy", q: "Hány húrja van egy hagyományos gitárnak?", answers: ["6", "4", "5", "7"], correct: 0 },
  { cat: 6, diff: "easy", q: "Melyik együttes adta ki a 'Bohemian Rhapsody' című dalt?", answers: ["Queen", "The Beatles", "Rolling Stones", "Pink Floyd"], correct: 0 },
  { cat: 6, diff: "medium", q: "Ki komponálta a 'Kilencedik szimfóniát' (Örömóda)?", answers: ["Beethoven", "Mozart", "Bach", "Chopin"], correct: 0 },
  { cat: 6, diff: "medium", q: "Melyik hangszer tartozik a fúvós hangszerek közé?", answers: ["Trombita", "Hegedű", "Zongora", "Dob"], correct: 0 },
  { cat: 6, diff: "medium", q: "Melyik magyar zeneszerző írta a 'Háry János' című daljátékot?", answers: ["Kodály Zoltán", "Bartók Béla", "Liszt Ferenc", "Erkel Ferenc"], correct: 0 },
  { cat: 6, diff: "hard", q: "Hány billentyű van egy standard zongorán?", answers: ["88", "76", "61", "102"], correct: 0 },
  { cat: 6, diff: "hard", q: "Ki szerezte a magyar Himnusz zenéjét?", answers: ["Erkel Ferenc", "Kölcsey Ferenc", "Liszt Ferenc", "Egressy Béni"], correct: 0 },
  { cat: 7, diff: "easy", q: "Ki írta a 'János vitéz' című elbeszélő költeményt?", answers: ["Petőfi Sándor", "Arany János", "Ady Endre", "József Attila"], correct: 0 },
  { cat: 7, diff: "easy", q: "Ki írta a 'Rómeó és Júlia' című drámát?", answers: ["William Shakespeare", "Molière", "Goethe", "Dante"], correct: 0 },
  { cat: 7, diff: "medium", q: "Ki írta az 'Egri csillagok' című regényt?", answers: ["Gárdonyi Géza", "Jókai Mór", "Mikszáth Kálmán", "Móricz Zsigmond"], correct: 0 },
  { cat: 7, diff: "medium", q: "Melyik magyar költő írta a 'Nemzeti dal' című verset?", answers: ["Petőfi Sándor", "Arany János", "Vörösmarty Mihály", "Ady Endre"], correct: 0 },
  { cat: 7, diff: "medium", q: "Ki a szerzője a 'Bűn és bűnhődés' című regénynek?", answers: ["Dosztojevszkij", "Tolsztoj", "Csehov", "Puskin"], correct: 0 },
  { cat: 7, diff: "hard", q: "Melyik évben kapott Kertész Imre irodalmi Nobel-díjat?", answers: ["2002", "1996", "2010", "1988"], correct: 0 },
  { cat: 7, diff: "hard", q: "Ki írta 'Az ember tragédiája' című drámai költeményt?", answers: ["Madách Imre", "Vörösmarty Mihály", "Katona József", "Arany János"], correct: 0 },
  { cat: 8, diff: "easy", q: "Mit jelent a 'CPU' rövidítés?", answers: ["Központi feldolgozó egység", "Számítógépes tápegység", "Grafikus kártya", "Merevlemez"], correct: 0 },
  { cat: 8, diff: "easy", q: "Melyik cég fejlesztette a Windows operációs rendszert?", answers: ["Microsoft", "Apple", "Google", "IBM"], correct: 0 },
  { cat: 8, diff: "easy", q: "Hány bit egy bájt?", answers: ["8", "4", "16", "32"], correct: 0 },
  { cat: 8, diff: "medium", q: "Mit jelent a 'HTML' rövidítés?", answers: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Mode Language"], correct: 0 },
  { cat: 8, diff: "medium", q: "Ki alapította a Microsoftot Paul Allennel együtt?", answers: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Larry Page"], correct: 0 },
  { cat: 8, diff: "medium", q: "Melyik programozási nyelv logója egy kávéscsésze?", answers: ["Java", "Python", "C++", "Ruby"], correct: 0 },
  { cat: 8, diff: "hard", q: "Melyik évben mutatták be az első iPhone-t?", answers: ["2007", "2005", "2010", "2003"], correct: 0 },
  { cat: 8, diff: "hard", q: "Mit jelent az 'SQL' rövidítés?", answers: ["Structured Query Language", "Simple Question Language", "System Query Logic", "Standard Quality Level"], correct: 0 },
  { cat: 8, diff: "hard", q: "Melyik adatszerkezet működik a LIFO (utoljára be, először ki) elv szerint?", answers: ["Verem (stack)", "Sor (queue)", "Láncolt lista", "Fa"], correct: 0 },
  { cat: 9, diff: "easy", q: "Ki festette a Mona Lisát?", answers: ["Leonardo da Vinci", "Michelangelo", "Raffaello", "Van Gogh"], correct: 0 },
  { cat: 9, diff: "easy", q: "Melyik művész vágta le a saját fülét?", answers: ["Vincent van Gogh", "Pablo Picasso", "Claude Monet", "Salvador Dalí"], correct: 0 },
  { cat: 9, diff: "medium", q: "Melyik stílusirányzat fő képviselője Salvador Dalí?", answers: ["Szürrealizmus", "Impresszionizmus", "Kubizmus", "Reneszánsz"], correct: 0 },
  { cat: 9, diff: "medium", q: "Ki tervezte a barcelonai Sagrada Família templomot?", answers: ["Antoni Gaudí", "Le Corbusier", "Frank Lloyd Wright", "Gustave Eiffel"], correct: 0 },
  { cat: 9, diff: "hard", q: "Melyik városban található a Louvre múzeum?", answers: ["Párizs", "London", "Madrid", "Róma"], correct: 0 },
  { cat: 9, diff: "hard", q: "Ki festette a 'Csillagos éj' című képet?", answers: ["Vincent van Gogh", "Claude Monet", "Edvard Munch", "Gustav Klimt"], correct: 0 },
  { cat: 10, diff: "easy", q: "Hány napból áll egy szökőév?", answers: ["366", "365", "364", "367"], correct: 0 },
  { cat: 10, diff: "easy", q: "Milyen színt kapunk, ha a kéket és a sárgát összekeverjük?", answers: ["Zöld", "Lila", "Narancs", "Barna"], correct: 0 },
  { cat: 10, diff: "easy", q: "Hány óra van egy napban?", answers: ["24", "12", "48", "36"], correct: 0 },
  { cat: 10, diff: "medium", q: "Melyik pénznemet használják Japánban?", answers: ["Jen", "Won", "Jüan", "Bát"], correct: 0 },
  { cat: 10, diff: "medium", q: "Hány kontinens van a Földön?", answers: ["7", "5", "6", "8"], correct: 0 },
  { cat: 10, diff: "medium", q: "Melyik vitaminból jutunk sokhoz napfény hatására?", answers: ["D-vitamin", "C-vitamin", "B12-vitamin", "A-vitamin"], correct: 0 },
  { cat: 10, diff: "hard", q: "Hány elem található a periódusos rendszerben (2024-es állapot szerint kb.)?", answers: ["118", "108", "120", "98"], correct: 0 },
  { cat: 10, diff: "hard", q: "Melyik évben lépett le először ember a Holdra?", answers: ["1969", "1972", "1961", "1975"], correct: 0 },
];

const kerdesBeszuro = db.prepare("INSERT INTO questions (category_id, difficulty, question_text, points, created_by, is_public) VALUES (?, ?, ?, ?, 1, 1)");
const valaszBeszuro = db.prepare("INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)");

// vegigmegyunk a kerdeseken es egyesevel beszurjuk oket a valaszokkal
for (let i = 0; i < kerdesek.length; i++) {
  let k = kerdesek[i];
  let pont = pontTabla[k.diff];
  let eredmeny = kerdesBeszuro.run(k.cat, k.diff, k.q, pont);
  let kerdesId = eredmeny.lastInsertRowid;

  // beszurjuk a valaszokat, a helyes az amelyik indexe egyezik a correct-tel
  for (let j = 0; j < k.answers.length; j++) {
    let helyesE = 0;
    if (j === k.correct) {
      helyesE = 1;
    }
    valaszBeszuro.run(kerdesId, k.answers[j], helyesE);
  }
}
console.log("kerdesek es valaszok feltoltve: " + kerdesek.length + " kerdes");

// FELTOLTUNK NEHANY KESZ KVIZT
const kvizBeszuro = db.prepare("INSERT INTO quizzes (title, description, created_by, mode, is_public) VALUES (?, ?, ?, ?, ?)");
kvizBeszuro.run("Vegyes tudáspróba", "Minden témából egy kis ízelítő", 1, "classic", 1);
kvizBeszuro.run("Villámkör – időre", "Gyors kérdések visszaszámlálóval", 2, "timed", 1);
kvizBeszuro.run("Milliomos kihívás", "Fokozódó nehézségű kérdéssor", 2, "millionaire", 1);
kvizBeszuro.run("Történelem mesterkör", "Csak a bátraknak, nehéz kérdésekkel", 1, "classic", 1);

// HOZZARENDELJUK A KERDESEKET A KVIZEKHEZ
const qqBeszuro = db.prepare("INSERT INTO quiz_questions (quiz_id, question_id, position) VALUES (?, ?, ?)");

// egy kis segedfuggveny ami lekeri a kerdes id-kat szures alapjan
function kerdesIdk(kategoria, nehezseg, darab) {
  let sql = "SELECT id FROM questions WHERE 1 = 1";
  let params = [];
  if (kategoria !== null) {
    sql = sql + " AND category_id = ?";
    params.push(kategoria);
  }
  if (nehezseg !== null) {
    sql = sql + " AND difficulty = ?";
    params.push(nehezseg);
  }
  sql = sql + " ORDER BY id";
  let sorok = db.prepare(sql).all(params);
  let idk = [];
  for (let i = 0; i < sorok.length; i++) {
    idk.push(sorok[i].id);
  }
  if (darab !== null) {
    idk = idk.slice(0, darab);
  }
  return idk;
}

// 1. kviz: vegyes tudasproba - minden kategoriabol egy konnyu kerdes
let pozicio = 0;
for (let c = 1; c <= 10; c++) {
  let idk = kerdesIdk(c, "easy", 1);
  if (idk.length > 0) {
    pozicio = pozicio + 1;
    qqBeszuro.run(1, idk[0], pozicio);
  }
}

// 2. kviz: villamkor - 8 konnyu vegyes kerdes
let flash = kerdesIdk(null, "easy", 8);
for (let i = 0; i < flash.length; i++) {
  qqBeszuro.run(2, flash[i], i + 1);
}

// 3. kviz: milliomos - konnyutol nehezig
let mill = kerdesIdk(null, "easy", 3).concat(kerdesIdk(null, "medium", 3)).concat(kerdesIdk(null, "hard", 3));
for (let i = 0; i < mill.length; i++) {
  qqBeszuro.run(3, mill[i], i + 1);
}

// 4. kviz: tortenelem mesterkor - nehez tortenelmi kerdesek
let hist = kerdesIdk(1, "hard", null);
for (let i = 0; i < hist.length; i++) {
  qqBeszuro.run(4, hist[i], i + 1);
}
console.log("kvizek es kerdes hozzarendelesek kesz");

console.log("KESZ! az adatbazis felepult: " + dbFile);
db.close();
