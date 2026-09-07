QuizArena - hordozhato (portable) inditas
==========================================

Ez a mappa a QuizArena alkalmazast egy hordozhato Node.js futtatokornyezettel
egyutt tartalmazza, hogy Node.js telepitese nelkul, egyetlen dupla-kattintassal
ki lehessen probalni barmelyik Windows (64 bites) gepen.

HASZNALAT
---------
1. Dupla kattintas az "Inditas.bat" fajlra.
2. Elso inditaskor a program felepiti es feltolti az adatbazist (ez nehany
   masodpercig tart, egy fekete ablakban lathato a folyamat).
3. Automatikusan megnyilik a bongeszo a http://localhost:3000 cimen.
4. A szervert futtato fekete ablakot ("QuizArena szerver") NE zard be,
   amig hasznalod az alkalmazast - ez futtatja a hatteret.
5. A leallitashoz egyszeruen zard be a "QuizArena szerver" ablakot.

TESZT FIOKOK
------------
  admin@quizarena.hu   / admin123   (admin)
  host@quizarena.hu    / host123    (host)
  anna@example.com     / jelszo1    (player)
  bela@example.com     / jelszo2    (player)
  cili@example.com     / jelszo3    (player)

MAPPA TARTALMA
--------------
  node/    - hordozhato Node.js v22.23.2 futtatokornyezet (Windows x64)
  app/     - a QuizArena teljes forraskodja es fuggosegei (mar telepitve)
  Inditas.bat - az inditoszkript

Megjegyzes: ez a mappa a forraskod/ mappaval megegyezo alkalmazast tartalmazza,
csak onmagaban futtathato formaban. A fejlesztéshez / forráskód olvasásához
a forraskod/ mappat hasznald.
