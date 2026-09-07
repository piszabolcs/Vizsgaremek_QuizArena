====================================================
QuizArena - vizsgaremek
Szoftverfejlesztő és -tesztelő képzés (OKTÁV)
Készítette: Pintér Szabolcs, Perger Balázs
====================================================

Ez a leiras a leadott csomag mappaszerkezetet mutatja be.

adatbazis/
  Az adatmodell ER-diagramja (kep), a relacios sema (schema.sql, MySQL
  nyelvjarasban) es a kezdoadatok (seed.sql). Reszletek: adatbazis/README.txt

dokumentum/
  A szoftver- es tesztelesi dokumentacio, PDF formatumban (es a Word
  forrasfajlok is mellekelve):
    - QuizArena_szoftverdokumentacio.pdf
    - QuizArena_tesztelesi_dokumentacio.pdf

forraskod/
  A teljes alkalmazas forraskodja (Node.js + Express backend, natív HTML/
  CSS/JS frontend). Sajat, reszletes README.md-t tartalmaz a telepitesi es
  futtatasi lepesekkel, valamint a tests/ mappaban az automata tesztekkel.
  Gyors inditas:
    cd forraskod
    npm install
    npm run seed
    npm start
  Ezutan: http://localhost:3000

prezentacio/
  A vizsgaremek bemutatasahoz keszult prezentacio (QuizArena_bemutato.pptx).

telepito_portable/
  Hordozhato, onmagaban futtathato valtozat: tartalmaz egy beepitett Node.js
  futtatokornyezetet is, igy Node.js telepitese nelkul, egyetlen dupla-
  kattintassal (Inditas.bat) kiprobalhato az alkalmazas barmelyik 64 bites
  Windows gepen. Reszletek: telepito_portable/README.txt

----------------------------------------------------
GitHub: https://github.com/piszabolcs/Vizsgaremek_QuizArena
----------------------------------------------------
