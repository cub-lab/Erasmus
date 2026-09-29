const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow,
  TableCell, WidthType, ShadingType, BorderStyle, LevelFormat, TableOfContents, PageBreak, Header,
  Footer, PageNumber, VerticalAlign, TableLayoutType,
} = require("docx");

const IMG = path.join(__dirname, "gata");
const DIM = JSON.parse(fs.readFileSync(path.join(__dirname, "dimensiuni.json"), "utf8"));
const IESIRE = process.argv[2];

const ACCENT = "1F4E79";   // albastru închis (titluri)
const ACCENT2 = "2E7D32";  // verde (corect)
const GRI = "5F6B7A";
const FUNDAL_TABEL = "E3ECF5";
const FUNDAL_COD = "F2F4F7";
const FONT = "Calibri";
const MONO = "Consolas";
const LATIME = 9638; // A4 cu margini de 2 cm, în DXA

// ---------- text cu **îngroșat** și `cod` ----------
function runs(text, opt = {}) {
  const bucati = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((b) => b !== "");
  return bucati.map((b) => {
    if (b.startsWith("**")) return new TextRun({ text: b.slice(2, -2), bold: true, ...opt });
    if (b.startsWith("`")) return new TextRun({ text: b.slice(1, -1), font: MONO, size: 20, color: "8A2B2B", ...opt });
    return new TextRun({ text: b, ...opt });
  });
}
const p = (text, opt = {}) => new Paragraph({ children: runs(text), spacing: { after: 120, line: 288 }, ...opt });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: true });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const li = (t, nivel = 0) => new Paragraph({ numbering: { reference: "puncte", level: nivel }, children: runs(t), spacing: { after: 60, line: 276 } });
let listaNumerotata = 0;
function nr(elemente) {
  listaNumerotata++;
  return elemente.map((t) => new Paragraph({ numbering: { reference: "numere", level: 0, instance: listaNumerotata }, children: runs(t), spacing: { after: 60, line: 276 } }));
}
const cod = (linii) => linii.map((l, i) => new Paragraph({
  children: [new TextRun({ text: l === "" ? " " : l, font: MONO, size: 19 })],
  shading: { type: ShadingType.CLEAR, fill: FUNDAL_COD, color: "auto" },
  spacing: { before: i === 0 ? 80 : 0, after: i === linii.length - 1 ? 160 : 0, line: 260 },
  indent: { left: 200, right: 200 },
}));
function nota(text, culoare = ACCENT) {
  return new Paragraph({
    children: runs(text),
    shading: { type: ShadingType.CLEAR, fill: "EEF4FA", color: "auto" },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: culoare, space: 8 } },
    indent: { left: 240 }, spacing: { before: 120, after: 200, line: 288 },
  });
}

// ---------- imagini ----------
let numarFigura = 0;
function dimensiune(nume, maxLatCm, maxInaltCm) {
  const [w, h] = DIM[nume];
  const pxCm = 96 / 2.54;
  let lat = maxLatCm * pxCm;
  let inalt = (lat * h) / w;
  if (inalt > maxInaltCm * pxCm) { inalt = maxInaltCm * pxCm; lat = (inalt * w) / h; }
  return { width: Math.round(lat), height: Math.round(inalt) };
}
function imagine(nume, maxLatCm, maxInaltCm) {
  return new ImageRun({
    type: "jpg", data: fs.readFileSync(path.join(IMG, nume + ".jpg")),
    transformation: dimensiune(nume, maxLatCm, maxInaltCm),
    altText: { title: nume, description: nume, name: nume },
  });
}
function figura(nume, legenda, maxLatCm = 16, maxInaltCm = 19.5) {
  numarFigura++;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 160, after: 60 },
      children: [imagine(nume, maxLatCm, maxInaltCm)],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "D0D7E0", space: 4 },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "D0D7E0", space: 4 },
                left: { style: BorderStyle.SINGLE, size: 4, color: "D0D7E0", space: 4 },
                right: { style: BorderStyle.SINGLE, size: 4, color: "D0D7E0", space: 4 } },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 240 },
      children: [new TextRun({ text: `Figura ${numarFigura}. `, bold: true, size: 19, color: GRI }),
                 new TextRun({ text: legenda, italics: true, size: 19, color: GRI })],
    }),
  ];
}

// ---------- tabele ----------
const margini = { top: 80, bottom: 80, left: 110, right: 110 };
const chenar = { style: BorderStyle.SINGLE, size: 4, color: "B7C4D3" };
const chenare = { top: chenar, bottom: chenar, left: chenar, right: chenar };
function tabel(capete, randuri, latimi) {
  const total = latimi.reduce((a, b) => a + b, 0);
  const cel = (text, i, antet) => new TableCell({
    width: { size: latimi[i], type: WidthType.DXA }, margins: margini, borders: chenare,
    shading: antet ? { type: ShadingType.CLEAR, fill: FUNDAL_TABEL, color: "auto" } : undefined,
    children: String(text).split("\n").map((linie) => new Paragraph({ children: runs(linie, antet ? { bold: true } : {}), spacing: { after: 40, line: 264 } })),
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: latimi, layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ tableHeader: true, children: capete.map((c, i) => cel(c, i, true)) }),
      ...randuri.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cel(c, i, false)) })),
    ],
  });
}
const spatiu = () => new Paragraph({ children: [], spacing: { after: 120 } });

// Capturi de telefon: câte trei pe rând, fără chenare de tabel.
function randTelefoane(elemente) {
  const lat = Math.floor(LATIME / 3);
  const fara = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new Table({
    width: { size: lat * 3, type: WidthType.DXA }, columnWidths: [lat, lat, lat], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ cantSplit: true, children: elemente.map(([nume, legenda]) => {
      numarFigura++;
      return new TableCell({
        width: { size: lat, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 80, right: 80 },
        borders: { top: fara, bottom: fara, left: fara, right: fara }, verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [imagine(nume, 4.9, 10.6)],
            border: { top: { style: BorderStyle.SINGLE, size: 12, color: "3A3F47", space: 2 }, bottom: { style: BorderStyle.SINGLE, size: 12, color: "3A3F47", space: 2 },
                      left: { style: BorderStyle.SINGLE, size: 12, color: "3A3F47", space: 2 }, right: { style: BorderStyle.SINGLE, size: 12, color: "3A3F47", space: 2 } } }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 160 },
            children: [new TextRun({ text: `Figura ${numarFigura}. `, bold: true, size: 18, color: GRI }), new TextRun({ text: legenda, italics: true, size: 18, color: GRI })] }),
        ],
      });
    }) })],
  });
}

// =====================================================================
// GHIDUL AUTORULUI – conținut (se lipește după funcțiile ajutătoare din genereaza.js)
// =====================================================================
const PROIECT = path.join(__dirname, "..", "..");

function liniiFisier(fisier) {
  return fs.readFileSync(path.join(PROIECT, fisier), "utf8").split("\n");
}
// Extrage din cod o funcție sau o constantă, exact cum e scrisă în proiect.
function extrage(fisier, inceput, opt = {}) {
  const linii = liniiFisier(fisier);
  const i = linii.findIndex((l) => l.startsWith(inceput));
  if (i < 0) throw new Error("nu găsesc «" + inceput + "» în " + fisier);
  let rez = [linii[i]];
  for (let j = i + 1; j < linii.length; j++) {
    const l = linii[j];
    if (l !== "" && !/^[\s)\]}]/.test(l)) break;
    rez.push(l);
  }
  while (rez.length && rez[rez.length - 1].trim() === "") rez.pop();
  if (opt.faraDocstring) {
    const a = rez.findIndex((l, k) => k > 0 && l.trim().startsWith('"""'));
    if (a > 0) {
      let b = a;
      if (!(rez[a].trim().length > 3 && rez[a].trim().endsWith('"""'))) {
        b = rez.findIndex((l, k) => k > a && l.trim().endsWith('"""'));
      }
      rez = rez.slice(0, a).concat(rez.slice(b + 1));
    }
  }
  if (opt.max && rez.length > opt.max) rez = rez.slice(0, opt.max).concat(["    # ... (continuă în fișier)"]);
  return rez;
}
function extrageIntre(fisier, start, sfarsit) {
  const linii = liniiFisier(fisier);
  const i = linii.findIndex((l) => l.startsWith(start));
  let j = sfarsit ? linii.findIndex((l, k) => k > i && l.startsWith(sfarsit)) : linii.length;
  if (i < 0 || j < 0) throw new Error("interval negăsit în " + fisier);
  const rez = linii.slice(i, j);
  while (rez.length && rez[rez.length - 1].trim() === "") rez.pop();
  return rez;
}
const nrRanduri = (fisier) => liniiFisier(fisier).filter((l, k, a) => k < a.length - 1 || l !== "").length;

const codMic = (linii) => linii.map((l, i) => new Paragraph({
  children: [new TextRun({ text: l === "" ? " " : l, font: MONO, size: 16 })],
  shading: { type: ShadingType.CLEAR, fill: FUNDAL_COD, color: "auto" },
  spacing: { before: i === 0 ? 80 : 0, after: i === linii.length - 1 ? 180 : 0, line: 240 },
  indent: { left: 160, right: 160 },
  keepLines: true,
}));
const eticheta = (text) => new Paragraph({ spacing: { before: 160, after: 40 }, keepNext: true,
  children: [new TextRun({ text, bold: true, size: 18, color: GRI })] });
const deRetinut = (text) => nota("**De reținut:** " + text, ACCENT2);

const intrebariJson = JSON.parse(fs.readFileSync(path.join(PROIECT, "intrebari.json"), "utf8"));
const peNivel = (n) => intrebariJson.filter((q) => q.nivel === n).length;

// ---------- Copertă ----------
const copertaLinie2 = (a, b) => new TableRow({ children: [
  new TableCell({ width: { size: 3000, type: WidthType.DXA }, margins: margini, borders: chenare, shading: { type: ShadingType.CLEAR, fill: FUNDAL_TABEL, color: "auto" }, children: [new Paragraph({ children: [new TextRun({ text: a, bold: true })] })] }),
  new TableCell({ width: { size: 6638, type: WidthType.DXA }, margins: margini, borders: chenare, children: [new Paragraph({ children: runs(b) })] }),
] });
const coperta = [
  new Paragraph({ spacing: { before: 2200 }, children: [] }),
  new Paragraph({ children: [new TextRun({ text: "LOGICLAB · DOCUMENTAȚIE PENTRU AUTOR", bold: true, size: 22, color: GRI, characterSpacing: 40 })] }),
  new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: "Cum funcționează proiectul", bold: true, size: 72, color: ACCENT })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Ghid explicativ, fișier cu fișier, pentru prezentarea în fața comisiei", size: 30, color: "333333" })] }),
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } }, spacing: { after: 480 },
    children: [new TextRun({ text: "Structura proiectului, rolul fiecărui fișier, codul important explicat pas cu pas", size: 24, italics: true, color: GRI })] }),
  new Table({ width: { size: LATIME, type: WidthType.DXA }, columnWidths: [3000, 6638], layout: TableLayoutType.FIXED, rows: [
    copertaLinie2("Autor", "BASALIC Mihai, clasa a IX-a, Colegiul Național Militar „Tudor Vladimirescu”"),
    copertaLinie2("Aplicația", "erasmus99.streamlit.app"),
    copertaLinie2("Codul sursă", "github.com/cub-lab/Erasmus"),
    copertaLinie2("Limbaj", "Python 3.10+ cu biblioteca Streamlit"),
    copertaLinie2("Data", "Septembrie 2026"),
  ] }),
];
const cuprins = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Cuprins")] }),
  new TableOfContents("Cuprins", { hyperlink: true, headingStyleRange: "1-2" }),
  nota("Dacă cuprinsul apare gol, dați clic dreapta pe el și alegeți **Actualizare câmp**, apoi **Actualizare tabel întreg**."),
];

// ---------- 0. Cum folosești ghidul ----------
const introducere = [
  h1("Cum folosești acest ghid"),
  p("Ghidul explică **cum este construit** LogicLab, ca să poți răspunde la orice întrebare a comisiei despre cod. Manualul de utilizare arată *ce face* aplicația; acest ghid arată *cum o face*."),
  p("Recomandare de citire:"),
  ...nr([
    "**Capitolul 1** (imaginea de ansamblu) și **capitolul 2** (structura folderului): trebuie să le știi foarte bine, sunt primele întrebări.",
    "**Capitolul 4** (motorul logic): este „inima” proiectului. Învață pe de rost cei patru pași ai validării și exemplul cu stiva.",
    "**Capitolul 5** (evaluarea) și **capitolul 6** (`intrebari.json`): explică învățarea personalizată, cerința principală a probei.",
    "**Capitolul 12**: întrebări posibile de la comisie, cu răspunsuri scurte.",
  ]),
  p("Toate bucățile de cod din ghid sunt **copiate automat din proiect**, deci sunt exact cele din fișierele tale."),
];

// ---------- 1. Imaginea de ansamblu ----------
const ansamblu = [
  h1("1. Imaginea de ansamblu"),
  p("LogicLab este împărțit în **trei straturi**. Fiecare strat are o singură responsabilitate, iar asta face proiectul ușor de explicat și de modificat."),
  tabel(["Strat", "Fișiere", "Ce face"], [
    ["**1. Datele**\n(conținutul)", "`intrebari.json`\n`lectii.py`\n`fisa_RED.md`", "Textele lecțiilor, întrebările testelor și fișa resursei. Le poate modifica un profesor, fără să înțeleagă programarea."],
    ["**2. Logica**\n(„creierul”, core-ul)", "`logica.py`\n`evaluare.py`\nfuncțiile de calcul din `aplicatii.py`", "Calculează: verifică și evaluează expresii, construiește tabele de adevăr, alege întrebările, calculează scorul și nivelul, face feedbackul pe teme. **Nu desenează nimic pe ecran.**"],
    ["**3. Interfața**\n(ce vede elevul)", "`app.py`\nfuncțiile `arata_...` din `aplicatii.py`", "Desenează paginile cu Streamlit, citește ce apasă elevul și cere straturilor 1 și 2 datele și calculele."],
  ], [2200, 2800, 4638]),
  spatiu(),
  h2("1.1 Unde este core-ul aplicației?"),
  p("Core-ul are două părți:"),
  li("**`logica.py` – motorul logic.** Primește un text ca `(p and q) -> r`, verifică dacă e scris corect și sigur, îl evaluează pentru toate combinațiile de 1 și 0 și spune dacă e tautologie. Îl folosesc generatorul de tabele, lecțiile (pentru tabelele de adevăr) și testele automate (pentru a verifica răspunsurile din `intrebari.json`)."),
  li("**`evaluare.py` – învățarea personalizată.** Alege aleator întrebările, calculează scorul, stabilește nivelul, deblochează Nivelul 2 și scrie mesajele de tipul „Ai greșit 3 din 4 întrebări despre implicație”."),
  p("`app.py` este cel mai lung fișier, dar el doar **leagă** lucrurile: afișează și apelează funcțiile din core."),
  deRetinut("Partea de calcul este separată de partea de afișare. De aceea fiecare funcție de calcul se poate testa singură, cu `pytest`, fără să deschizi aplicația."),
  h2("1.2 Cine pe cine folosește"),
  tabel(["Fișierul…", "…folosește", "Pentru ce"], [
    ["`app.py`", "`logica.py`", "Generatorul de tabele și tabelele din lecții"],
    ["`app.py`", "`evaluare.py`", "Testul de încadrare și testele pe niveluri"],
    ["`app.py`", "`lectii.py`", "Lista și conținutul lecțiilor"],
    ["`app.py`", "`aplicatii.py`", "Secțiunea „Unde se folosește?”"],
    ["`app.py`", "`fisa_RED.md`", "Secțiunea „Despre această resursă”"],
    ["`evaluare.py`", "`intrebari.json`", "Citește banca de întrebări"],
    ["`evaluare.py`", "`lectii.py`", "Află titlul lecției recomandate în feedback"],
    ["`tests/…`", "toate fișierele de mai sus", "Verifică automat că totul este corect"],
  ], [2400, 2600, 4638]),
];

// ---------- 2. Structura folderului ----------
const structura = [
  h1("2. Structura proiectului"),
  ...codMic([
    "logiclab/",
    "├── app.py                  # interfața (paginile, meniul, butoanele)",
    "├── logica.py               # CORE: motorul logic",
    "├── evaluare.py             # CORE: teste, scor, niveluri, feedback",
    "├── lectii.py               # conținutul celor 10 lecții",
    "├── aplicatii.py            # cele 6 demonstrații din „Unde se folosește?”",
    "├── intrebari.json          # banca de întrebări (o editează profesorii)",
    "├── fisa_RED.md             # fișa resursei educaționale deschise",
    "├── README.md               # prezentarea proiectului pe GitHub",
    "├── LICENSE                 # licențele MIT (cod) și CC BY-SA 4.0 (conținut)",
    "├── requirements.txt        # bibliotecile necesare: streamlit, pytest",
    "├── pytest.ini              # setări pentru pytest",
    "├── .gitignore              # ce NU se urcă pe GitHub (.venv, __pycache__)",
    "├── .streamlit/config.toml  # aspect (text de 18 px), fără statistici",
    "├── deploy/                 # publicarea pe un server propriu (opțional)",
    "├── docs/                   # manualele Word și scripturile lor",
    "└── tests/                  # testele automate",
    "    ├── test_logica.py",
    "    ├── test_intrebari.py",
    "    ├── test_lectii.py",
    "    └── test_aplicatii.py",
  ]),
  tabel(["Fișier", "Rânduri", "Îl modifici când vrei să…"], [
    ["`app.py`", String(nrRanduri("app.py")), "schimbi aspectul unei pagini, un text de pe ecran, meniul"],
    ["`logica.py`", String(nrRanduri("logica.py")), "adaugi un operator nou sau un mesaj de eroare"],
    ["`evaluare.py`", String(nrRanduri("evaluare.py")), "schimbi câte întrebări are un test sau pragurile de 60% / 70%"],
    ["`lectii.py`", String(nrRanduri("lectii.py")), "modifici sau adaugi o lecție"],
    ["`aplicatii.py`", String(nrRanduri("aplicatii.py")), "modifici o demonstrație (porți, if, parole, SQL, XOR, sistem expert)"],
    ["`intrebari.json`", String(nrRanduri("intrebari.json")), "adaugi, ștergi sau corectezi o întrebare"],
    ["`fisa_RED.md`", String(nrRanduri("fisa_RED.md")), "schimbi autorul, bibliografia, competențele"],
  ], [2400, 1300, 5938]),
  spatiu(),
  deRetinut("Pentru conținut (întrebări, lecții, fișa RED) nu trebuie atins codul. Asta cere cerința de **adaptabilitate** a unei RED."),
];

// ---------- 3. Cum funcționează Streamlit ----------
const streamlit = [
  h1("3. Cum funcționează o aplicație Streamlit"),
  p("Streamlit transformă un script Python obișnuit într-o pagină web. Nu scrii HTML sau JavaScript: fiecare comandă `st.…` pune un element pe pagină."),
  tabel(["Comandă", "Ce apare pe pagină", "Unde o folosim"], [
    ["`st.title(\"…\")`", "un titlu mare", "titlul fiecărei secțiuni"],
    ["`st.markdown(\"…\")`", "text formatat (**îngroșat**, liste)", "definițiile lecțiilor, enunțurile"],
    ["`st.button(\"…\")`", "un buton", "„Verifică răspunsul”, „Reia testul”"],
    ["`st.radio(\"…\", variante)`", "variante de bifat", "răspunsurile la întrebări, meniul"],
    ["`st.text_input(\"…\")`", "o căsuță de text", "generatorul de tabele, parola"],
    ["`st.checkbox(\"…\")`", "o căsuță de bifat", "întrerupătoarele de la porțile logice"],
    ["`st.table(date)`", "un tabel", "tabelele de adevăr"],
    ["`st.success / st.error`", "o casetă verde / roșie", "✅ corect / ❌ greșit"],
  ], [2900, 3000, 3738]),
  spatiu(),
  h2("3.1 Scriptul rulează din nou la fiecare clic"),
  p("Aceasta este cea mai importantă idee despre Streamlit. Când elevul apasă un buton sau bifează ceva:"),
  ...nr([
    "browserul trimite serverului noua valoare;",
    "Streamlit **rulează din nou tot `app.py`, de sus până jos**;",
    "de data aceasta, `st.radio(...)` întoarce varianta bifată, `st.button(...)` întoarce `True` etc.;",
    "pagina se redesenează cu noile valori.",
  ]),
  h2("3.2 Memoria: st.session_state"),
  p("Pentru că scriptul pornește mereu de la zero, variabilele obișnuite se pierd. Ce trebuie ținut minte între două clicuri se pune în `st.session_state`, un dicționar special care rămâne cât timp pagina este deschisă. Funcția `pregateste_sesiunea()` din `app.py` pune valorile de pornire:"),
  ...codMic(extrage("app.py", "def pregateste_sesiunea")),
  tabel(["Cheia din session_state", "Ce păstrează"], [
    ["`sectiune`", "Secțiunea deschisă din meniu"],
    ["`nivel`", "`None` (necunoscut), `1` sau `2`"],
    ["`intrebari_incadrare`", "Cele 6 întrebări alese pentru încadrare"],
    ["`raspunsuri_incadrare`", "Răspunsurile de la încadrare (după trimitere)"],
    ["`scor_nivel1`", "Cel mai bun procent la testul de Nivel 1"],
    ["`test`", "Testul pe nivel aflat în desfășurare: întrebările, poziția, răspunsurile"],
    ["`intrebari_vazute`", "Id-urile întrebărilor deja primite, pe fiecare nivel"],
    ["`runda`", "Un contor care crește la fiecare test nou, pentru chei unice"],
  ], [3200, 6438]),
  spatiu(),
  h2("3.3 Butoane cu on_click (callback)"),
  p("Un buton poate primi o funcție care se execută **înainte** de rularea din nou a scriptului:"),
  ...codMic(["st.button(\"Verifică răspunsul\", type=\"primary\", on_click=verifica_raspuns)"]),
  p("Astfel, când pagina se redesenează, datele sunt deja actualizate (de exemplu, răspunsul este deja salvat în `st.session_state[\"test\"]`)."),
  deRetinut("Nu există bază de date și nici conturi. Tot ce știe aplicația despre elev stă în `st.session_state` și dispare când se închide pagina. De aceea resursa nu colectează date personale."),
];

// ---------- 4. logica.py ----------
const logica = [
  h1("4. logica.py – motorul logic (core)"),
  p("Motorul logic primește un text scris de elev și răspunde la trei întrebări: *este scris corect?*, *care este tabelul lui de adevăr?*, *este tautologie, contradicție sau realizabilă?*"),
  h2("4.1 Problema: de ce nu folosim direct eval()"),
  p("Python are funcția `eval()`, care execută un text ca și cum ar fi cod. Ar fi tentant să scriem `eval(\"p and q\")`. Problema: dacă elevul scrie `__import__('os').system('...')`, `eval()` ar executa acea comandă pe server. De aceea **nu lăsăm niciodată textul elevului să ajungă direct la eval()**. Îl verificăm întâi simbol cu simbol."),
  h2("4.2 Constantele de la început"),
  ...codMic(extrage("logica.py", "VARIABILE =").concat(extrage("logica.py", "SIMBOLURI_PERMISE ="))),
  p("Lista **albă** a simbolurilor permise. Orice altceva este respins."),
  ...codMic(extrage("logica.py", "TRADUCERI =")),
  p("Dicționarul de traducere în Python. Pentru valori True/False, `p <= q` este exact implicația: este fals doar pentru `True <= False`."),
  h2("4.3 Pasul 1: împărțirea în simboluri (tokeni)"),
  ...codMic(extrage("logica.py", "def imparte_in_simboluri", { faraDocstring: true })),
  p("Funcția parcurge textul caracter cu caracter (indicele `i`):"),
  li("sare peste spații;"),
  li("recunoaște `<->` și `->` (întâi `<->`, altfel ar citi greșit doar `->`);"),
  li("citește un **cuvânt întreg** din litere și cifre (de exemplu `and`, `p`, dar și `import`);"),
  li("orice alt caracter (paranteză, `&`, `;`) devine un simbol separat."),
  p("Exemplu: `\"(p and q) -> r\"` devine `[\"(\", \"p\", \"and\", \"q\", \")\", \"->\", \"r\"]`."),
  h2("4.4 Pasul 2: validarea"),
  ...codMic(extrage("logica.py", "def valideaza", { faraDocstring: true })),
  p("Validarea are trei verificări, în ordine:"),
  ...nr([
    "**Fiecare simbol este în lista permisă.** Aici se opresc `import`, `__import__`, `open`, `.`, `;` etc. Pentru greșelile frecvente (de exemplu `&` sau `∧`), dicționarul `SUGESTII` propune varianta corectă.",
    "**Parantezele și regula de prioritate** (funcția `verifica_paranteze`, explicată mai jos).",
    "**Ordinea simbolurilor**: expresia se evaluează o dată de probă. Dacă Python nu o înțelege (de exemplu `p and`), este scrisă greșit. Acest `eval()` este sigur, pentru că fiecare simbol a fost deja verificat, iar `{\"__builtins__\": {}}` îi ia accesul la funcțiile Python.",
  ]),
  h2("4.5 Regula parantezelor și stiva"),
  p("În Python, `<=`, `==` și `!=` au altă prioritate decât implicația și echivalența în logică. De exemplu, `p and q <= r` ar însemna în Python `p and (q <= r)`, nu `(p and q) -> r`. Soluția: cerem paranteze. Regula exactă: **într-un grup de paranteze în care apare `->`, `<->` sau `xor`, acel operator trebuie să fie singurul operator.**"),
  ...codMic(extrage("logica.py", "def verifica_paranteze", { faraDocstring: true })),
  p("O **stivă** este o listă la care adăugăm și scoatem doar de la capăt (ca un teanc de farfurii). Fiecare „(” pune un grup nou pe stivă, fiecare „)” scoate grupul de sus și îl verifică. Exemplu pentru `(p and q) -> r`:"),
  tabel(["Simbol", "Ce face programul", "Stiva după pas"], [
    ["`(`", "deschide un grup nou", "`[ [], [] ]`"],
    ["`p`", "variabilă: nimic", "`[ [], [] ]`"],
    ["`and`", "operator: îl pune în grupul de sus", "`[ [], [\"and\"] ]`"],
    ["`q`", "variabilă: nimic", "`[ [], [\"and\"] ]`"],
    ["`)`", "scoate grupul `[\"and\"]` și îl verifică: nu are `->`, deci e corect", "`[ [] ]`"],
    ["`->`", "operator în grupul exterior", "`[ [\"->\"] ]`"],
    ["`r`", "variabilă: nimic", "`[ [\"->\"] ]`"],
    ["final", "grupul exterior are doar `->`: **corect**", "–"],
  ], [1300, 5338, 3000]),
  spatiu(),
  p("Pentru `p and q -> r` grupul exterior ar fi `[\"and\", \"->\"]`: operatorul `->` nu este singur, deci apare mesajul „Pune paranteze…”."),
  h2("4.6 Pasul 3: traducerea"),
  ...codMic(extrage("logica.py", "def traduce", { faraDocstring: true })),
  p("Fiecare simbol din dicționarul `TRADUCERI` este înlocuit, restul rămân la fel: `(p and q) -> r` devine `( p and q ) <= r`."),
  h2("4.7 Pasul 4: tabelul de adevăr"),
  ...codMic(extrage("logica.py", "def tabel_adevar", { faraDocstring: true })),
  p("`itertools.product([True, False], repeat=n)` generează toate cele **2ⁿ combinații** de valori. Pentru fiecare combinație, expresia tradusă se evaluează, iar rezultatul se scrie ca 1 sau 0. Rândurile ies în ordinea din manual: 11, 10, 01, 00."),
  h2("4.8 Clasificarea"),
  ...codMic(extrage("logica.py", "def clasifica", { faraDocstring: true })),
  p("Dacă în coloana rezultatului nu există niciun 0, expresia este tautologie; dacă nu există niciun 1, este contradicție; altfel este realizabilă."),
  deRetinut("Cei patru pași: **împart în simboluri → validez → traduc → evaluez**. Textul elevului ajunge la `eval()` doar după ce fiecare simbol a fost verificat."),
];

// ---------- 5. evaluare.py ----------
const evaluare = [
  h1("5. evaluare.py – învățarea personalizată (core)"),
  p("Acest fișier conține toate regulile testelor. Nu știe nimic despre ecran: primește liste și numere și întoarce liste și numere."),
  h2("5.1 Regulile, într-un singur loc"),
  ...codMic(extrageIntre("evaluare.py", "# Câte întrebări primește elevul", "# Cum apare fiecare temă")),
  p("Dacă vrei ca încadrarea să aibă 8 întrebări sau Nivelul 2 să se deblocheze de la 80%, schimbi doar aceste rânduri."),
  h2("5.2 Cum se aleg întrebările"),
  ...codMic(extrage("evaluare.py", "def alege_intrebari", { faraDocstring: true })),
  p("Algoritmul, în cuvinte:"),
  ...nr([
    "Grupează întrebările nivelului pe **teme** și, în fiecare temă, în **noi** (pe care elevul nu le-a văzut încă) și **vechi**.",
    "Amestecă fiecare grup (`random.shuffle`).",
    "Ia **câte o întrebare din fiecare temă, pe rând**, întâi doar dintre cele noi. Abia dacă nu ajung, completează cu cele vechi.",
    "Amestecă ordinea întrebărilor și, la întrebările grilă, ordinea variantelor (`amesteca_variante`).",
  ]),
  p(`Exemplu: la încadrare sunt ${peNivel(0)} întrebări, câte 3 pe 6 teme. Prima tură ia câte una din fiecare temă, deci 6 întrebări din 6 teme diferite. La „Reia încadrarea” se aleg din cele 12 rămase.`),
  h2("5.3 Scor, nivel și deblocare"),
  ...codMic(extrage("evaluare.py", "def nivel_dupa_incadrare", { faraDocstring: true }).concat([""]).concat(extrage("evaluare.py", "def nivel2_deblocat", { faraDocstring: true }))),
  h2("5.4 Feedbackul pe teme"),
  p("După test, `statistici_pe_teme` numără, pentru fiecare temă, câte întrebări au fost și câte au fost greșite, de exemplu `{\"implicația\": {\"total\": 4, \"gresite\": 3}}`. Apoi `mesaje_feedback` scrie mesajele:"),
  ...codMic(extrage("evaluare.py", "def mesaje_feedback", { faraDocstring: true, max: 22 })),
  p("Temele sunt ordonate de la cea cu cele mai multe greșeli. Titlul lecției vine din `lectii.py` (funcția `titlu_lectie_pentru_tema`), iar pentru tema „aplicații” se recomandă secțiunea „Unde se folosește?”."),
  deRetinut("Personalizarea are trei niveluri: **încadrarea** decide de unde pornești, **deblocarea** te lasă să avansezi când ești pregătit, iar **feedbackul pe teme** îți spune exact ce să recitești."),
];

// ---------- 6. intrebari.json ----------
const exemplu = intrebariJson.find((q) => q.id === 104);
const json = [
  h1("6. intrebari.json – banca de întrebări"),
  p(`Fișierul conține **${intrebariJson.length} de întrebări**: ${peNivel(0)} pentru încadrare, ${peNivel(1)} pentru Nivelul 1 și ${peNivel(2)} pentru Nivelul 2. Elevul primește doar o parte, aleasă aleator (6 la încadrare, 10 la teste).`),
  h2("6.1 Ce este JSON"),
  p("**JSON** este un format de text pentru date, foarte asemănător cu listele și dicționarele din Python:"),
  li("`[ ... ]` este o **listă** (aici, lista tuturor întrebărilor);"),
  li("`{ ... }` este un **obiect**, adică un dicționar cu perechi `\"cheie\": valoare` (aici, o întrebare);"),
  li("textele stau între ghilimele drepte `\"...\"`, iar elementele se despart prin virgulă."),
  p("Python îl citește cu o singură linie, în `evaluare.py`: `json.load(fisier)`. Rezultatul este o listă de dicționare Python."),
  h2("6.2 O întrebare"),
  ...codMic(JSON.stringify(exemplu, null, 2).split("\n")),
  tabel(["Câmp", "Ce conține", "Reguli"], [
    ["`id`", "Numărul unic al întrebării", "Nu se repetă. Convenție: 1–99 încadrare, 101–199 Nivel 1, 201–299 Nivel 2"],
    ["`nivel`", "`0`, `1` sau `2`", "0 = încadrare, 1 = începător, 2 = avansat"],
    ["`tema`", "Tema, pentru feedback", "Una dintre: `negația`, `conjuncția`, `disjuncția`, `implicația`, `echivalența`, `xor`, `de_morgan`, `tautologii`, `deducție`, `aplicații`"],
    ["`tip`", "`grila` sau `adevarat_fals`", "La `adevarat_fals` variantele sunt exact `[\"Adevărat\", \"Fals\"]`"],
    ["`enunt`", "Textul întrebării", "Poate conține cod între apostrofuri inverse: \\`if x > 5\\`"],
    ["`variante`", "Lista răspunsurilor posibile", "Fără variante repetate. La grilă, ordinea se amestecă automat"],
    ["`raspuns_corect`", "Răspunsul corect", "Scris **exact** ca una dintre variante"],
    ["`explicatie`", "De ce e corect", "Apare după ce elevul răspunde"],
  ], [2000, 2600, 5038]),
  spatiu(),
  h2("6.3 Cum adaugi o întrebare, pas cu pas"),
  ...nr([
    "Deschide `intrebari.json` (în VS Code sau direct pe GitHub, cu butonul ✏️).",
    "Mergi la ultima întrebare a nivelului dorit. După acolada ei `}` pune o **virgulă**.",
    "Lipește întrebarea nouă (poți copia una existentă și o modifici).",
    "Dă-i un `id` nou, nefolosit, din intervalul nivelului.",
    "Verifică: `raspuns_corect` este scris exact ca una dintre `variante`.",
    "Rulează `pytest`. Dacă ceva e greșit, testele îți spun unde.",
    "Salvează. Local, reîncarcă pagina; pe GitHub, aplicația publicată se actualizează singură.",
  ]),
  h2("6.4 Greșeli frecvente"),
  tabel(["Greșeala", "Ce se întâmplă", "Cum se repară"], [
    ["Lipsește virgula dintre două întrebări", "Fișierul nu mai poate fi citit; aplicația dă eroare", "`pytest` arată rândul; adaugă virgula"],
    ["Ghilimele „românești” în loc de \"drepte\" în jurul textelor", "JSON invalid", "Folosește `\"`. Ghilimelele „” sunt permise doar în interiorul textului"],
    ["`raspuns_corect` scris puțin diferit (spațiu, diacritică)", "Nicio variantă nu ar fi corectă", "Testul `test_fiecare_intrebare_e_corect_scrisa` o semnalează"],
    ["`id` repetat", "Două întrebări se confundă", "Testul `test_id_urile_sunt_unice` o semnalează"],
    ["Temă scrisă greșit (de exemplu `implicatie`)", "Feedbackul nu găsește lecția", "Testul verifică temele; folosește lista de mai sus"],
  ], [3000, 3200, 3438]),
  spatiu(),
  h2("6.5 Cum sunt verificate răspunsurile"),
  p("În `tests/test_intrebari.py`, răspunsul corect al întrebărilor care se pot calcula este **recalculat cu motorul logic**. De exemplu, pentru întrebarea 104 („p = 1, q = 0, cât este p ∧ q?”) testul calculează `1 and 0` și verifică că răspunsul din fișier este `0`. Astfel, o greșeală matematică în bancă este prinsă automat."),
];

// ---------- 7. lectii.py ----------
const lectii = [
  h1("7. lectii.py – conținutul lecțiilor"),
  p("Fișierul conține o singură variabilă, `LECTII`: o listă de 10 dicționare, câte unul pentru fiecare lecție. Nu are funcții. Este, practic, date scrise în Python."),
  h2("7.1 O lecție"),
  ...codMic((() => {
    const linii = liniiFisier("lectii.py");
    const i = linii.findIndex((l) => l.includes('"titlu": "Negația"')) - 1;
    const j = linii.findIndex((l, k) => k > i && l === "    },");
    return linii.slice(i, j + 1);
  })()),
  tabel(["Câmp", "Ce conține"], [
    ["`titlu`, `nivel`", "Numele lecției și nivelul (1 sau 2); lecțiile de Nivel 2 apar cu „(Nivel 2)”"],
    ["`tema`", "Aceeași temă ca în `intrebari.json`; așa leagă feedbackul testelor de lecție"],
    ["`obiectiv`, `definitie`", "Textele lecției (pot conține **îngroșat** și liste Markdown)"],
    ["`simbol`, `scriere`", "Simbolul matematic (¬p) și cum se scrie în LogicLab (`not p`)"],
    ["`alte_notatii`, `cuvinte`", "Opționale: notațiile de la Logică (~p) și cuvintele care exprimă operatorul"],
    ["`tabel`", "Perechi (expresie, etichetă). Tabelul **nu** e scris de mână: îl calculează `logica.py`"],
    ["`exemplu`", "Exemplul din viața reală"],
    ["`exercitiu`", "Întrebarea, variantele, răspunsul și explicația exercițiului final"],
  ], [2900, 6738]),
  spatiu(),
  h2("7.2 Cum este afișată o lecție"),
  p("Funcția `arata_lectii()` din `app.py` ia lecția aleasă din listă și afișează fiecare câmp cu `st.markdown`. Tabelul de adevăr îl construiește `construieste_tabel()`, care apelează `logica.tabel_adevar()` pentru fiecare expresie și pune rezultatele una lângă alta (așa se văd, de exemplu, cele două părți ale legilor lui De Morgan)."),
  deRetinut("Tabelele de adevăr din lecții nu pot avea greșeli, pentru că sunt calculate de motorul logic, iar `tests/test_lectii.py` verifică în plus că legile prezentate sunt tautologii."),
];

// ---------- 8. app.py ----------
const app = [
  h1("8. app.py – interfața"),
  p("`app.py` construiește toate paginile. Are multe funcții, dar toate urmează același tipar: **o funcție `arata_...` pentru fiecare pagină** și câteva funcții mici apelate de butoane."),
  h2("8.1 Harta funcțiilor"),
  tabel(["Grup", "Funcții", "Ce fac"], [
    ["Pornire și navigare", "`pregateste_sesiunea`, `mergi_la`, `mergi_la_tema`, `arata_bara_laterala`, `eticheta_meniu`", "Valorile de pornire, meniul, trecerea la altă secțiune"],
    ["Pagini", "`arata_acasa`, `arata_generator`, `arata_lectii`, `arata_despre`, `arata_subsol`", "Câte o funcție pentru fiecare pagină"],
    ["Încadrare", "`alege_si_retine`, `arata_test_incadrare`, `arata_rezultat_incadrare`, `reia_incadrarea`, `cheie_incadrare`", "Alege 6 întrebări, afișează formularul, calculează nivelul"],
    ["Teste pe niveluri", "`incepe_test`, `verifica_raspuns`, `urmatoarea_intrebare`, `termina_test`, `inchide_test`", "Funcțiile apelate de butoane (on_click)"],
    ["Afișarea testelor", "`arata_teste`, `arata_alegere_nivel`, `arata_intrebare_curenta`, `arata_rezultat_test`, `arata_corectare`", "Ce vede elevul în fiecare moment al testului"],
  ], [2200, 4400, 3038]),
  spatiu(),
  h2("8.2 Programul principal"),
  p("La sfârșitul fișierului se află partea care rulează efectiv, la fiecare clic:"),
  ...codMic(extrageIntre("app.py", "st.set_page_config", null)),
  p("Un simplu `if / elif` alege funcția paginii în funcție de secțiunea din meniu. Aceasta este „rețeta” întregii aplicații."),
  h2("8.3 Testul pe niveluri, ca stare"),
  p("Testul în desfășurare este un dicționar în `st.session_state[\"test\"]`:"),
  ...codMic(extrage("app.py", "def incepe_test(", { faraDocstring: true })),
  p("`pozitie` arată la ce întrebare a ajuns elevul, `verificat` dacă a apăsat deja „Verifică”. Funcția `arata_teste()` decide ce să afișeze: alegerea nivelului (dacă nu există test), întrebarea curentă sau rezultatul final (când `pozitie` a ajuns la 10)."),
];

// ---------- 9. aplicatii.py ----------
const aplicatii = [
  h1("9. aplicatii.py – cele 6 demonstrații"),
  p("Fiecare demonstrație are **o funcție de calcul** (testată cu pytest) și **o funcție de afișare** `arata_...`."),
  tabel(["Demonstrația", "Funcția de calcul", "Ce calculează"], [
    ["Porți logice", "`poarta(tip, a, b)`", "Ieșirea porții AND / OR / XOR / NOT"],
    ["if în Python", "– (direct `logat and permisiune`)", "Dacă pagina se afișează"],
    ["Parole", "`verifica_parola(parola)`", "Cele trei condiții: lungime, majusculă, cifră"],
    ["SQL", "`filtreaza_elevi(elevi, oras, varsta, operator)`", "Elevii care îndeplinesc condiția cu AND / OR"],
    ["XOR", "`xor_text`, `coduri_text`, `text_din_coduri`, `in_binar`", "Criptarea și decriptarea bit cu bit (operatorul `^` din Python)"],
    ["Sistem expert", "`deduce(regula, valori, concluzie)`", "Concluzia și regula de raționament folosită"],
  ], [2000, 3900, 3738]),
  spatiu(),
  h2("9.1 Exemplu simplu: poarta logică"),
  ...codMic(extrage("aplicatii.py", "def poarta")),
  h2("9.2 Sistemul expert: funcția deduce"),
  p("Funcția primește regula (de exemplu „Dacă plouă ȘI nu am umbrelă, atunci mă ud”), ce știe elevul despre fiecare condiție (`True`, `False` sau `None` = nu știu) și ce știe despre concluzie. Deciziile, în ordine:"),
  tabel(["Situația", "Concluzia sistemului", "Regula"], [
    ["Toate condițiile adevărate, dar concluzia falsă", "Faptele contrazic regula", "Contradicție"],
    ["Toate condițiile adevărate", "Concluzia este adevărată", "Modus Ponens"],
    ["Concluzia falsă, o singură condiție necunoscută", "Acea condiție este falsă", "Modus Tollens"],
    ["Concluzia falsă, mai multe necunoscute", "Cel puțin o condiție este falsă („…SAU…”)", "Modus Tollens + De Morgan"],
    ["O condiție falsă", "Nu se poate deduce nimic despre concluzie", "Ipoteza este falsă"],
    ["Concluzia adevărată, ipoteza necunoscută", "Nu se poate deduce ipoteza", "Greșeală de evitat"],
  ], [3600, 3600, 2438]),
];

// ---------- 10. Celelalte fișiere și testele ----------
const altele = [
  h1("10. Celelalte fișiere și testele automate"),
  h2("10.1 Fișierele de configurare"),
  tabel(["Fișier", "Rol"], [
    ["`requirements.txt`", "Lista bibliotecilor: `streamlit>=1.64` și `pytest`. Streamlit Cloud le instalează automat de aici."],
    ["`.streamlit/config.toml`", "Mărimea textului (`baseFontSize = 18`) și dezactivarea statisticilor de utilizare (`gatherUsageStats = false`)."],
    ["`pytest.ini`", "Îi spune lui pytest să caute modulele în folderul proiectului și testele în `tests/`."],
    ["`.gitignore`", "Ce nu se urcă pe GitHub: `.venv` (bibliotecile instalate), `__pycache__`."],
    ["`fisa_RED.md`", "Fișa resursei: autor, competențe, scenariu, licență, bibliografie. Pagina „Despre” o afișează direct."],
    ["`README.md`", "Prezentarea proiectului pe GitHub, cum se rulează, cum se adaugă o întrebare."],
    ["`LICENSE`", "Textul licențelor: MIT pentru cod, CC BY-SA 4.0 pentru conținut."],
    ["`deploy/`", "Fișiere pentru publicarea pe un server propriu (nginx, systemd). Nu sunt necesare pentru Streamlit Cloud."],
    ["`docs/`", "Manualele Word și scripturile care le generează din capturi reale."],
  ], [2800, 6838]),
  spatiu(),
  h2("10.2 Testele automate (folderul tests/)"),
  p("Un test automat este o funcție care verifică ceva și se oprește cu eroare dacă rezultatul nu e cel așteptat. Exemplu din `tests/test_logica.py`:"),
  ...codMic(extrage("tests/test_logica.py", "def test_implicatia")),
  p("Comanda `pytest` găsește automat toate funcțiile care încep cu `test_` și le rulează. Rezultatul actual: **toate testele trec**."),
  tabel(["Fișier", "Ce verifică"], [
    ["`test_logica.py`", "Fiecare operator, De Morgan, tautologii, contradicții, respingerea codului periculos, parantezele, mesajele"],
    ["`test_intrebari.py`", "Structura băncii de întrebări, răspunsurile recalculate cu motorul, alegerea aleatoare echilibrată pe teme, fără repetări, variantele amestecate, încadrarea, deblocarea, feedbackul"],
    ["`test_lectii.py`", "Câmpurile lecțiilor, expresiile din tabele, răspunsurile exercițiilor, legile sunt tautologii"],
    ["`test_aplicatii.py`", "Porțile, parolele, filtrul SQL, criptarea XOR, deducțiile sistemului expert"],
  ], [2400, 7238]),
];

// ---------- 11. Drumul datelor ----------
const drum = [
  h1("11. Drumul unui clic, de la buton la rezultat"),
  p("Exemplu complet: elevul dă testul de Nivel 1. Așa circulă datele prin fișiere:"),
  tabel(["Pas", "Ce se întâmplă", "Unde"], [
    ["1", "Elevul apasă „Începe testul de Nivel 1”; se apelează `incepe_test(1)`", "`app.py`"],
    ["2", "`alege_si_retine(1, 10)` citește întrebările și ce a văzut deja elevul", "`app.py` → `evaluare.py`"],
    ["3", "`incarca_intrebari()` citește fișierul JSON", "`evaluare.py` → `intrebari.json`"],
    ["4", "`alege_intrebari()` alege 10 întrebări pe teme, preferând cele nevăzute, și amestecă variantele", "`evaluare.py`"],
    ["5", "Testul se salvează în `st.session_state[\"test\"]`, apoi Streamlit rulează din nou scriptul", "`app.py`"],
    ["6", "`arata_teste()` vede un test început și afișează întrebarea curentă", "`app.py`"],
    ["7", "Elevul apasă „Verifică”: `verifica_raspuns()` salvează răspunsul; pagina arată ✅/❌ și explicația", "`app.py`"],
    ["8", "După a 10-a întrebare, `termina_test()` calculează procentul și, la minimum 70%, deblochează Nivelul 2", "`app.py` → `evaluare.py`"],
    ["9", "`statistici_pe_teme()` și `mesaje_feedback()` scriu recomandările", "`evaluare.py` → `lectii.py`"],
    ["10", "Butonul „Deschide” apelează `mergi_la_tema()` și deschide lecția recomandată", "`app.py`"],
  ], [800, 6138, 2700]),
];

// ---------- 12. Întrebări de la comisie ----------
const intrebariComisie = [
  h1("12. Întrebări posibile de la comisie"),
  ...[
    ["De ce ai ales Streamlit?", "Pentru că pot scrie toată aplicația în Python, limbajul pe care îl învăț la școală. Streamlit generează pagina web și o face să meargă și pe telefon, iar eu m-am putut concentra pe logică: motorul de evaluare, testele și feedbackul."],
    ["Unde este core-ul aplicației?", "În `logica.py` (motorul care verifică și evaluează expresiile) și în `evaluare.py` (regulile învățării personalizate). `app.py` doar afișează și apelează aceste funcții."],
    ["Cum te-ai asigurat că aplicația e sigură?", "Textul scris de elev nu ajunge niciodată direct la `eval()`. Îl împart în simboluri și accept doar simbolurile dintr-o listă albă. Am testat și 13 încercări de atac, toate respinse."],
    ["De ce trebuie paranteze la implicație?", "Pentru că traduc `->` în `<=`, iar în Python `<=` are altă prioritate decât implicația în logică. Cu paranteze obligatorii, tabelul afișat este exact al expresiei gândite de elev."],
    ["Cum este personalizată învățarea?", "Prin trei mecanisme: testul de încadrare (Nivel 1 sau 2), deblocarea Nivelului 2 la 70% și feedbackul pe teme, care trimite la lecția potrivită."],
    ["De ce nu se repetă testele?", "Banca are aproape 100 de întrebări. Aplicația ia temele pe rând, preferă întrebările pe care elevul nu le-a văzut și amestecă variantele."],
    ["Unde se salvează datele elevilor?", "Nicăieri. Totul stă în `st.session_state` doar cât e deschisă pagina. Nu există conturi, bază de date sau statistici trimise."],
    ["Cum adaugă un profesor o întrebare?", "Editează `intrebari.json`, după modelul unei întrebări existente, și rulează `pytest` ca să verifice. Nu trebuie să știe programare."],
    ["Cum știi că răspunsurile din bancă sunt corecte?", "Testele automate recalculează cu motorul logic răspunsul fiecărei întrebări care se poate calcula. Dacă cineva scrie un răspuns greșit, testul pică."],
    ["De ce ai ales licența CC BY-SA 4.0?", "Pentru că este licența standard pentru resurse educaționale deschise (o folosește și Wikipedia): oricine poate folosi și adapta lecțiile și întrebările, cu condiția să mă menționeze ca autor și să lase și versiunea lui la fel de deschisă. Pentru cod am ales MIT, o licență simplă de software, pentru că licențele Creative Commons nu sunt gândite pentru programe."],
    ["Ce înseamnă RED și cum o respectă proiectul?", "Resursă Educațională Deschisă: licență deschisă (CC BY-SA 4.0 și MIT), acces liber fără cont, poate fi adaptată de oricine și are fișa descriptivă `fisa_RED.md`."],
  ].flatMap(([intrebare, raspuns]) => [
    new Paragraph({ keepNext: true, spacing: { before: 200, after: 60 }, children: [new TextRun({ text: "❓ " + intrebare, bold: true, color: ACCENT })] }),
    p(raspuns),
  ]),
];

// ---------- 13. Glosar ----------
const glosar = [
  h1("13. Glosar"),
  tabel(["Termen", "Explicație"], [
    ["Token (simbol)", "O bucată de text cu sens: un cuvânt (`and`), o variabilă (`p`), un operator (`->`), o paranteză"],
    ["Listă albă", "Lista lucrurilor permise; tot ce nu e în ea este respins"],
    ["Stivă", "Listă la care adaugi și scoți doar de la capăt (ultimul intrat, primul ieșit)"],
    ["Dicționar", "Colecție de perechi cheie → valoare, de exemplu `{\"nivel\": 1}`"],
    ["JSON", "Format de text pentru date, cu liste `[ ]` și obiecte `{ }`, asemănător cu Python"],
    ["session_state", "„Memoria” unei sesiuni Streamlit, păstrată între două clicuri"],
    ["Callback (on_click)", "Funcție dată unui buton, care se execută când e apăsat"],
    ["Test automat", "Funcție care verifică singură că o altă funcție dă rezultatul corect"],
    ["Commit / push", "Salvarea unei versiuni a codului (commit) și trimiterea ei pe GitHub (push)"],
    ["Deploy (publicare)", "Punerea aplicației pe internet, aici pe Streamlit Community Cloud"],
    ["2ⁿ", "Numărul de rânduri al unui tabel de adevăr cu n variabile"],
  ], [2600, 7038]),
];

// ---------- 14. Licențele ----------
const licente = [
  h1("14. Licențele proiectului"),
  p("Proiectul are **două licențe**, una pentru conținut și una pentru cod. Amândouă sunt trecute în fișierul `LICENSE`, în `README.md` și în subsolul aplicației."),
  tabel(["Ce anume", "Licența", "Unde se află"], [
    ["Conținutul educațional", "**CC BY-SA 4.0**", "Lecțiile (`lectii.py`), întrebările (`intrebari.json`), `fisa_RED.md`, manualele, textele din aplicație"],
    ["Codul", "**MIT**", "Fișierele `.py`"],
  ], [2600, 2000, 5038]),
  spatiu(),
  h2("14.1 Ce este CC BY-SA 4.0"),
  p("Este o licență **Creative Commons**. Prin ea, autorul spune din start ce au voie alții să facă cu materialul, fără să mai ceară permisiunea de fiecare dată. Este licența folosită, de exemplu, de **Wikipedia**."),
  tabel(["Parte", "În engleză", "Ce înseamnă"], [
    ["**CC**", "Creative Commons", "Organizația care a creat aceste licențe gratuite"],
    ["**BY**", "Attribution (Atribuire)", "Cine folosește materialul trebuie să **menționeze autorul**"],
    ["**SA**", "ShareAlike (Distribuire în condiții identice)", "Cine îl modifică și îl publică trebuie să-l publice **sub aceeași licență**"],
    ["**4.0**", "versiunea", "A patra versiune, cea actuală, valabilă internațional"],
  ], [1300, 3400, 4938]),
  spatiu(),
  h3("Ce are voie oricine"),
  li("**să copieze și să distribuie** materialul: să-l printeze, să-l pună pe un site, să-l trimită elevilor;"),
  li("**să-l modifice și să-l adapteze**: să adauge întrebări, să schimbe lecții, să-l traducă;"),
  li("**să-l folosească în orice scop**, inclusiv comercial."),
  h3("Cu ce condiții"),
  ...nr([
    "**Atribuire:** menționează autorul și licența și spune dacă a făcut modificări.",
    "**Aceeași licență:** dacă publică o versiune modificată, o lasă la fel de liberă, tot sub CC BY-SA 4.0. Nu o poate „închide” și vinde ca pe a lui.",
  ]),
  nota("„LogicLab”, de BASALIC Mihai (Colegiul Național Militar «Tudor Vladimirescu»), licența CC BY-SA 4.0, github.com/cub-lab/Erasmus"),
  h2("14.2 De ce se potrivește la LogicLab"),
  p("O **Resursă Educațională Deschisă** trebuie, prin definiție, să poată fi folosită și adaptată liber de alți profesori și elevi. CC BY-SA 4.0 permite exact asta și, în plus:"),
  li("**îl protejează pe autor**: numele lui rămâne pe material, chiar și în versiunile modificate;"),
  li("**păstrează resursa deschisă**: orice îmbunătățire făcută de altcineva rămâne și ea liberă pentru toți."),
  h2("14.3 De ce codul are altă licență (MIT)"),
  p("Licențele Creative Commons sunt gândite pentru **texte, imagini și materiale educaționale**, nu pentru programe. Pentru cod se folosesc licențe de software. **MIT** este una dintre cele mai simple: oricine poate folosi codul cum vrea, cu o singură condiție, să păstreze mențiunea „Copyright (c) 2026 BASALIC Mihai”."),
  h2("14.4 Răspunsul scurt pentru comisie"),
  nota("„Am ales CC BY-SA 4.0 pentru conținut pentru că este licența standard pentru resurse educaționale deschise: oricine poate folosi și adapta lecțiile și întrebările, cu condiția să mă menționeze ca autor și să lase și versiunea lui la fel de deschisă. Pentru cod am ales MIT, o licență simplă de software.”", ACCENT2),
  p("Rezumatul oficial al licenței, în limba română: creativecommons.org/licenses/by-sa/4.0/deed.ro"),
];

// =====================================================================
const doc = new Document({
  creator: "BASALIC Mihai",
  title: "LogicLab – Cum funcționează proiectul",
  description: "Ghid explicativ pentru autor: structura proiectului LogicLab, fișier cu fișier",
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 36, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "B7C4D3", space: 6 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 28, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 24, bold: true, color: "333333" },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: { config: [
    { reference: "puncte", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 280 } } } } ] },
    { reference: "numere", levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } } ] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } }, titlePage: true },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "LogicLab – Cum funcționează proiectul", size: 17, color: GRI })] })] }),
      first: new Header({ children: [new Paragraph({ children: [] })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Pagina ", size: 17, color: GRI }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: GRI }),
        new TextRun({ text: " din ", size: 17, color: GRI }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: GRI })] })] }),
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
    },
    children: [...coperta, ...cuprins, ...introducere, ...ansamblu, ...structura, ...streamlit, ...logica, ...evaluare,
               ...json, ...lectii, ...app, ...aplicatii, ...altele, ...drum, ...intrebariComisie, ...glosar, ...licente],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(IESIRE, buf);
  console.log("scris:", IESIRE, Math.round(buf.length / 1024), "KB");
});
