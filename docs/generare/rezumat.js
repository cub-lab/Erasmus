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
// REZUMATUL GHIDULUI – fișă de recapitulare (2–3 pagini)
// Se lipește după funcțiile ajutătoare din genereaza.js (vezi CITESTE.md).
// =====================================================================
const PROIECT = path.join(__dirname, "..", "..");
const intrebariJson = JSON.parse(fs.readFileSync(path.join(PROIECT, "intrebari.json"), "utf8"));
const peNivel = (n) => intrebariJson.filter((q) => q.nivel === n).length;

// Titluri fără pagină nouă, ca rezumatul să fie compact.
const t1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const t2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const pc = (text) => new Paragraph({ children: runs(text), spacing: { after: 80, line: 264 } });
const lic = (text) => new Paragraph({ numbering: { reference: "puncte", level: 0 }, children: runs(text), spacing: { after: 40, line: 252 } });

const antet = [
  new Paragraph({ children: [new TextRun({ text: "LOGICLAB · REZUMATUL GHIDULUI AUTORULUI", bold: true, size: 18, color: GRI, characterSpacing: 30 })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Tot proiectul, pe scurt", bold: true, size: 48, color: ACCENT })] }),
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: ACCENT, space: 4 } }, spacing: { after: 200 },
    children: [new TextRun({ text: "BASALIC Mihai · Colegiul Național Militar „Tudor Vladimirescu” · erasmus99.streamlit.app · github.com/cub-lab/Erasmus", size: 18, color: GRI })] }),
];

const continut = [
  t1("1. Ce este LogicLab"),
  pc("O **resursă educațională deschisă** (aplicație web gratuită, fără cont) prin care elevii de clasa a IX-a învață **propozițiile compuse** și văd unde se folosesc în informatică. Fiecare elev pornește de la nivelul lui și primește **feedback personalizat**."),

  t1("2. Structura: trei straturi"),
  tabel(["Strat", "Fișiere", "Rol"], [
    ["**Date**", "`intrebari.json`, `lectii.py`, `fisa_RED.md`", "Conținutul; îl poate modifica un profesor fără să programeze"],
    ["**Logică (core)**", "`logica.py`, `evaluare.py`", "Calculează tot; nu afișează nimic, deci se poate testa singur"],
    ["**Interfață**", "`app.py`, `aplicatii.py`", "Desenează paginile cu Streamlit și apelează core-ul"],
  ], [1900, 3700, 4038]),
  spatiu(),
  pc("**Core-ul** = `logica.py` (motorul care verifică și evaluează expresiile) + `evaluare.py` (regulile învățării personalizate)."),

  t1("3. Fișierele, într-un rând"),
  tabel(["Fișier", "Ce face"], [
    ["`app.py`", "Meniul și toate paginile; la final, un `if/elif` alege pagina deschisă"],
    ["`logica.py`", "Validează, traduce și evaluează expresiile; tabele de adevăr; tautologie / contradicție / realizabilă"],
    ["`evaluare.py`", "Alege întrebările aleator, calculează scorul și nivelul, deblochează Nivelul 2, scrie feedbackul"],
    ["`lectii.py`", "Lista celor 10 lecții (dicționare); tabelele lor le calculează `logica.py`"],
    ["`aplicatii.py`", "Cele 6 demonstrații: porți, if, parole, SQL, XOR, sistem expert"],
    ["`intrebari.json`", `Banca de ${intrebariJson.length} de întrebări (${peNivel(0)} încadrare, ${peNivel(1)} Nivel 1, ${peNivel(2)} Nivel 2)`],
    ["`tests/`", "60 de teste automate, rulate cu `pytest`"],
    ["`LICENSE`, `README.md`, `fisa_RED.md`", "Licențele, prezentarea proiectului, fișa resursei"],
  ], [3000, 6638]),
  spatiu(),

  t1("4. Motorul logic în 4 pași"),
  ...nr([
    "**Împart** textul în simboluri: `(p and q) -> r` → `( p and q ) -> r`.",
    "**Validez**: accept doar simbolurile din lista albă (`p q r and or not -> <-> xor ( ) 1 0`), verific parantezele.",
    "**Traduc** în Python: `->` → `<=`, `<->` → `==`, `xor` → `!=`.",
    "**Evaluez** pentru toate cele 2ⁿ combinații, cu `eval(..., {\"__builtins__\": {}}, valori)`, doar după validare.",
  ]),
  pc("**De ce paranteze obligatorii:** în Python, `<=`, `==`, `!=` au altă prioritate decât în logică. Regula: într-un grup cu `->`, `<->` sau `xor`, acel operator e singurul. Se verifică cu o **stivă**: fiecare „(” deschide un grup, fiecare „)” îl închide și îl verifică."),
  pc("**Siguranță:** textul elevului nu ajunge niciodată direct la `eval()`, deci `import os` sau `__import__(...)` sunt respinse cu un mesaj prietenos."),

  t1("5. Învățarea personalizată"),
  tabel(["Regulă", "Valoare"], [
    ["Încadrarea", `6 întrebări din ${peNivel(0)}, **câte una pe temă**; sub 60% → Nivel 1, minimum 60% → Nivel 2`],
    ["Testele pe niveluri", "10 întrebări aleatoare; temele se iau pe rând"],
    ["Fără repetări", "Se preferă întrebările nevăzute în sesiune; variantele de la grilă se amestecă"],
    ["Deblocarea Nivelului 2", "Încadrat direct la Nivel 2 **sau** minimum 70% la Nivel 1"],
    ["Feedback pe teme", "„Ai greșit 3 din 4 întrebări despre implicație. Recitește lecția «Implicația».” + buton spre lecție"],
  ], [2800, 6838]),
  spatiu(),
  pc("Toate numerele (6, 10, 60%, 70%) sunt constante în primele rânduri din `evaluare.py`."),

  t1("6. Cum adaugi o întrebare în intrebari.json"),
  pc("O întrebare are: `id` (unic), `nivel` (0/1/2), `tema`, `tip` (`grila` / `adevarat_fals`), `enunt`, `variante`, `raspuns_corect` (exact ca una dintre variante), `explicatie`."),
  ...nr([
    "Copiezi o întrebare existentă, după ultima, cu o **virgulă** între ele.",
    "Schimbi `id`-ul și textele.",
    "Rulezi `pytest`: testele arată orice greșeală (virgulă lipsă, răspuns care nu e printre variante, id repetat).",
    "Salvezi; pe GitHub, aplicația publicată se actualizează singură.",
  ]),

  t1("7. Streamlit în trei idei"),
  lic("Fiecare `st.…` pune un element pe pagină (titlu, buton, tabel)."),
  lic("La **fiecare clic**, tot `app.py` rulează din nou, de sus până jos."),
  lic("Ce trebuie ținut minte stă în `st.session_state` (nivel, scor, test în curs); butoanele folosesc `on_click` ca să actualizeze datele înainte de redesenare."),

  t1("8. Calitate, date personale, licențe"),
  lic("**60 de teste automate**: operatorii, De Morgan, respingerea codului periculos, răspunsul fiecărei întrebări recalculat cu motorul, alegerea aleatoare, feedbackul."),
  lic("**Nicio dată personală**: fără conturi, fără bază de date, statisticile Streamlit dezactivate; totul dispare la închiderea paginii."),
  lic("**Licențe**: conținutul sub **CC BY-SA 4.0** (oricine îl folosește și adaptează, menționând autorul și păstrând aceeași licență); codul sub **MIT**."),

  t1("9. Cifre de reținut"),
  tabel(["10 lecții", `${intrebariJson.length} de întrebări`, "6 demonstrații", "60 de teste"], [
    ["**6** întrebări la încadrare", "**10** întrebări pe test", "**60%** încadrare", "**70%** deblocare"],
    ["**3** variabile: p, q, r", "**2ⁿ** rânduri în tabel", "**2** licențe", "**0** date personale"],
  ], [2410, 2410, 2409, 2409]),
  spatiu(),

  t1("10. Cinci răspunsuri pentru comisie"),
  ...[
    ["Unde e core-ul?", "În `logica.py` (motorul) și `evaluare.py` (personalizarea); `app.py` doar afișează."],
    ["E sigur?", "Da: textul elevului e verificat simbol cu simbol înainte de orice evaluare."],
    ["Cum e personalizată?", "Încadrare pe nivel, deblocarea Nivelului 2 la 70%, feedback pe teme cu trimitere la lecție."],
    ["De ce nu se repetă testele?", "Aproape 100 de întrebări, alese pe teme, preferându-le pe cele nevăzute, cu variante amestecate."],
    ["De ce Streamlit?", "Toată aplicația e în Python, limbajul de la școală; Streamlit face pagina web și varianta de telefon."],
  ].flatMap(([q, r]) => [new Paragraph({ spacing: { before: 80, after: 20 }, keepNext: true, children: [new TextRun({ text: "❓ " + q, bold: true, color: ACCENT })] }), pc(r)]),
];

const doc = new Document({
  creator: "BASALIC Mihai",
  title: "LogicLab – Rezumatul ghidului autorului",
  styles: {
    default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 24, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 22, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: { config: [
    { reference: "puncte", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 240 } } } }] },
    { reference: "numere", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 280 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "LogicLab – rezumat · Pagina ", size: 16, color: GRI }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRI }),
      new TextRun({ text: " · Detalii în „LogicLab_Ghid_Autor.docx”", size: 16, color: GRI })] })] }) },
    children: [...antet, ...continut],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(IESIRE, buf);
  console.log("scris:", IESIRE, Math.round(buf.length / 1024), "KB");
});
