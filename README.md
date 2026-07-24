# QuizArena

Online kviz- es vetelkedo platform. Ez egy vizsgafeladat webalkalmazas, amit
Node.js + Express backenddel es egyszeru HTML/CSS/JavaScript frontenddel keszult.
Az adatbazis SQLite, igy nem kell kulon adatbazis szervert telepiteni, minden
lokalisan fut.

## Mit tud az alkalmazas

- Regisztracio, bejelentkezes es kijelentkezes (session alapon), felugro ablakban
- A fooldal egy bemutatkozo oldal, a tobbi resz csak bejelentkezes utan latszik
- Kerdesbank kategoriakkal es nehezsegi szintekkel (80 kerdes van feltoltve)
- Kvizek (kerdessorok) listazasa es kitoltese
- Harom jatekmod:
  - **klasszikus**: egyszerre latszik az osszes kerdes, nincs idokorlat
  - **idore meno**: egyesevel jonnek a kerdesek, kerdesenkent 20 masodperc,
    ha lejar akkor automatikusan tovabblep es rossz valasznak szamit
  - **milliomos**: egyesevel jonnek a kerdesek nehezedo sorrendben, mindegyik
    idore megy, a rossz valasz azonnal kiesest jelent, es minden 5. helyes
    valasz utan plusz xp bonusz jar. Harom segitseg hasznalhato egyszer-egyszer:
    felezes, kozonseg szavazata, kerdes csere
- Pontozas: a helyes valasz a kerdes pontjat eri (idore meno modban ido bonusszal),
  a rossz valasz viszont levonassal jar (a kerdes pontjanak fele). A kviz
  vegeredmenye sose megy 0 ala.
- A kerdesek es a valaszlehetosegek sorrendje minden kitolteskor keveredik
- Szerveroldali pontszamitas (nem lehet a frontendrol csalni), es a helyes valasz
  nem is kerul ki a bongeszobe amig a jatekos nem valaszolt
- XP- es szintrendszer: minden kviz utan xp jar, es szintet lehet lepni
- Ranglista az xp alapjan
- Profil oldal a sajat adatokkal, korabbi eredmenyekkel es sajat kvizekkel
- Uj kerdes felvitele (host vagy admin joggal, egyelore csak api-n keresztul)

## Mihez van szukseg

- Node.js (ajanlott a 18-as vagy ujabb verzio)
- npm (ez a Node.js-szel egyutt jon)

## Telepites es inditas

1. Nyisd meg a terminalt a projekt mappajaban (ott ahol ez a README van).

2. Telepitsd a fuggosegeket:

   ```
   npm install
   ```

3. Epitsd fel az adatbazist (ez tolti fel a kerdesekkel es a teszt
   felhasznalokkal):

   ```
   npm run seed
   ```

4. Inditsd el a szervert:

   ```
   npm start
   ```

5. Nyisd meg a bongeszot es ird be:

   ```
   http://localhost:3000
   ```

Ennyi! Az adatbazis fajl (db/quizarena.db) nincs feltoltve a git-be, mert jatek
kozben folyamatosan valtozik, ezert kell a 3. lepes.

## Belepesi adatok a teszthez

Az adatbazisban van nehany kesz felhasznalo. A jelszavak egyszeruek, mert ez
csak egy vizsgafeladat (eles hasznalatra bcrypt-et kellene hasznalni):

| Email                  | Jelszo    | Szerep  |
|------------------------|-----------|---------|
| admin@quizarena.hu     | admin123  | admin   |
| host@quizarena.hu      | host123   | host    |
| anna@example.com       | jelszo1   | player  |
| bela@example.com       | jelszo2   | player  |
| cili@example.com       | jelszo3   | player  |

## Az adatbazis ujraepitese

Ha valamiert elrontanad az adatbazist, vagy tisztarol akarnal indulni, ezzel a
paranccsal ujra fel tudod epiteni (ez torli a regit es ujat csinal):

```
npm run seed
```

Fontos: ehhez a szervernek allnia kell! Ha kozben fut az `npm start`, akkor a
Windows nem engedi torolni az adatbazis fajlt es hibat kapsz (EBUSY). Eloszor
allitsd le a szervert (Ctrl+C), utana futtasd a seed-et, majd inditsd ujra.

## Tesztek futtatasa

A pontszamito logikahoz vannak automata tesztek. Igy tudod futtatni oket:

```
npm test
```

## Mappa szerkezet

```
quizarena/
├── server/               # a backend (Node.js + Express)
│   ├── app.js            # a fofajl, ez inditja a szervert
│   ├── config/db.js      # az adatbazis kapcsolat
│   ├── routes/           # az api utvonalak (auth, kerdesek, kvizek, jatek, ranglista, user)
│   ├── middleware/       # a bejelentkezes ellenorzese
│   └── utils/scoring.js  # a pontszamitas es xp logika
├── public/               # a frontend (amit a bongeszo lat)
│   ├── index.html        # fooldal (bemutatkozo oldal belepes/regisztracio gombbal)
│   ├── games.html        # a valaszthato kvizek listaja
│   ├── quiz.html         # egy kviz kitoltese
│   ├── leaderboard.html  # ranglista
│   ├── profile.html      # profil oldal
│   ├── logo.png          # a pajzs logo (navbarban)
│   ├── qalogo_svh.png    # a teljes logo felirattal (fooldalon)
│   ├── css/style.css     # a stiluslap
│   └── js/               # a frontend logika oldalankent
│       ├── layout.js     # a kozos navbar es a belepteto ablak (minden oldalon fut)
│       ├── games.js      # a kvizlista
│       ├── quiz.js       # a kviz kitoltese, idozito, milliomos mod
│       ├── leaderboard.js
│       └── profile.js
├── db/                   # az adatbazis
│   ├── quizarena.db      # a sqlite adatbazis (az "npm run seed" hozza letre)
│   ├── build_db.js       # ez epiti fel ujra az adatbazist
│   ├── schema.sql        # a tablak (MySQL valtozat, ha valaki azt hasznalna)
│   └── seed.sql          # a kezdoadatok (MySQL valtozat)
├── tests/                # az automata tesztek
├── .env.example          # pelda kornyezeti valtozok
├── package.json          # a projekt fuggosegei es parancsai
└── README.md             # ez a fajl
```

## Megjegyzesek

- Az adatbazis SQLite, de a db mappaban ott van a MySQL valtozat is (schema.sql
  es seed.sql), ha valaki MySQL-lel szeretne futtatni.
- A jelszavak SHA-256 hash-sel vannak tarolva. Ez vizsgafeladathoz eleg, de eles
  rendszerben bcrypt vagy hasonlo ajanlott.
- Az idozito es a milliomos mod segitsegei a bongeszoben futnak, a szerver ezeket
  nem kenyszeriti ki. A vegso pontszamot viszont mindig a szerver szamolja ki az
  adatbazisbol, szoval a pontszam nem hamisithato.
- A csapatos jatek alapjai le vannak rakva az adatbazisban (teams, session_players
  tablak), de ez meg nincs kesz, ez egy tovabb fejlesztheto resz.
