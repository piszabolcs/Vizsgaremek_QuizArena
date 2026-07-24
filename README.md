# QuizArena

Online kviz- es vetelkedo platform. Ez egy vizsgafeladat webalkalmazas, amit
Node.js + Express backenddel es egyszeru HTML/CSS/JavaScript frontenddel keszult.
Az adatbazis SQLite, igy nem kell kulon adatbazis szervert telepiteni, minden
lokalisan fut.

## Mit tud az alkalmazas

- Regisztracio, bejelentkezes es kijelentkezes (session alapon)
- Kerdesbank kategoriakkal es nehezsegi szintekkel (80 kerdes van feltoltve)
- Kvizek (kerdessorok) listazasa es kitoltese
- Szerveroldali pontszamitas (nem lehet a frontendrol csalni)
- XP- es szintrendszer: minden kviz utan xp jar, es szintet lehet lepni
- Ranglista az xp alapjan
- Profil oldal a sajat adatokkal, korabbi eredmenyekkel es sajat kvizekkel
- Uj kerdes felvitele (host vagy admin joggal)

## Mihez van szukseg

- Node.js (ajanlott a 18-as vagy ujabb verzio)
- npm (ez a Node.js-szel egyutt jon)

## Telepites es inditas

1. Nyisd meg a terminalt a projekt mappajaban (ott ahol ez a README van).

2. Telepitsd a fuggosegeket:

   ```
   npm install
   ```

3. Inditsd el a szervert:

   ```
   npm start
   ```

4. Nyisd meg a bongeszot es ird be:

   ```
   http://localhost:3000
   ```

Ennyi! Az adatbazis (db/quizarena.db) mar fel van toltve adatokkal, szoval
rogton ki tudod probalni.

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
│   ├── index.html        # fooldal a kvizekkel
│   ├── login.html        # belepes es regisztracio
│   ├── quiz.html         # egy kviz kitoltese
│   ├── leaderboard.html  # ranglista
│   ├── profile.html      # profil oldal
│   ├── css/style.css     # a stiluslap
│   └── js/               # a frontend logika oldalankent
├── db/                   # az adatbazis
│   ├── quizarena.db      # a kesz sqlite adatbazis (mar fel van toltve)
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
- A "Legyen On is milliomos" mod es a csapatos jatek alapjai le vannak rakva az
  adatbazisban es a backenden, ezek tovabb fejlesztheto reszek.
