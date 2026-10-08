# Helikopter

Pionowy shooter z widokiem z góry. Helikopter stoi w miejscu, przesuwa się tło. Gra jednoplikowa (HTML5 canvas) plus pakowanie do APK.

- Poziomy rosną powoli w trudności, na końcu każdego jest boss (silniejszy z każdym poziomem, 4 projekty).
- Zestrzeliwanie wrogów w powietrzu i na ziemi daje EXP (poziomy pilota: więcej życia i mocniejsze strzały).
- Z części wrogów wypada żeton: karabin, podwójny, potrójny, rakiety (od tego poziomu z boków pojawiają się skrzydła z zawiesiami), rakiety samonaprowadzające, laser, plazma.
- Grafika: wektorowa, rysowana w kodzie (własna).

Sterowanie: przeciąganie palcem albo strzałki / WASD. Pauza: P lub Esc.

Budowanie: `src/build.sh` składa `index.html` z `src/part*`. APK: `python3 tools/patch_template.py android/template.apk android/heli-template.apk pl.helikopter.game Helikopter android/icon.png`, potem `python3 tools/mkapk.py android/heli-template.apk index.html Helikopter.apk <katalog_kluczy>`.
Testy: `NODE_PATH=... node tests/smoke.js`, `tests/balance.js` (Playwright).
