# Cum se reface manualul Word

Manualul `docs/LogicLab_Manual.docx` este generat automat din capturi de ecran reale ale aplicației.

1. Pornește aplicația: `streamlit run app.py`
2. Capturi noi (cer `selenium` și `pillow`, instalate separat, nu fac parte din aplicație):
   `python docs/generare/capturi.py <folder_capturi>`
   apoi prelucrarea lor în `docs/generare/gata/` (tăiere margini, JPEG).
3. Documentul (cere Node.js și pachetul `docx`: `npm install docx`):
   `node docs/generare/genereaza.js docs/LogicLab_Manual.docx`

Numele autorului și al liceului se schimbă în `genereaza.js` (caută `BASALIC Mihai` și `Colegiul Național Militar „Tudor Vladimirescu”`).

## Ghidul autorului (`docs/LogicLab_Ghid_Autor.docx`)

Explică proiectul fișier cu fișier. Extrasele de cod sunt luate automat din fișierele proiectului,
deci după o modificare în cod ajunge să regenerezi documentul:
`node docs/generare/ghid.js docs/LogicLab_Ghid_Autor.docx`

## Rezumatul ghidului (`docs/LogicLab_Ghid_Rezumat.docx`)

Fișă de recapitulare de 2–3 pagini. Cifrele (numărul de întrebări) se citesc automat din `intrebari.json`:
`node docs/generare/rezumat.js docs/LogicLab_Ghid_Rezumat.docx`

## Tutorialul de pornire în VS Code (`docs/LogicLab_Pornire_VSCode.docx`)

`node docs/generare/tutorial.js docs/LogicLab_Pornire_VSCode.docx`
