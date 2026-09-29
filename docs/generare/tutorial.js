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
// TUTORIAL: cum pornești LogicLab în VS Code
// Se lipește după funcțiile ajutătoare din genereaza.js (vezi CITESTE.md).
// =====================================================================
const t1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const t2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const pas = (numar, titlu) => new Paragraph({ keepNext: true, spacing: { before: 200, after: 80 },
  children: [new TextRun({ text: "Pasul " + numar + " · ", bold: true, color: GRI }), new TextRun({ text: titlu, bold: true, color: ACCENT, size: 24 })] });
const tasta = (t) => "**" + t + "**";
const windowsMac = (win, mac) => tabel(["Windows", "macOS"], [[win, mac]], [4819, 4819]);

const antet = [
  new Paragraph({ children: [new TextRun({ text: "LOGICLAB · TUTORIAL", bold: true, size: 18, color: GRI, characterSpacing: 30 })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Cum pornești LogicLab în VS Code", bold: true, size: 48, color: ACCENT })] }),
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: ACCENT, space: 4 } }, spacing: { after: 200 },
    children: [new TextRun({ text: "Pentru Windows și macOS · durează aproximativ 10 minute prima dată, apoi câteva secunde", size: 20, color: GRI })] }),
  nota("**Pe scurt:** instalezi Python și VS Code, deschizi folderul proiectului, creezi mediul virtual cu bibliotecile, apoi apeși **F5**. Aplicația se deschide în browser, la **http://localhost:8501**."),
];

const instalare = [
  t1("Partea 1. Ce instalezi o singură dată"),
  pas(1, "Python 3.10 sau mai nou"),
  p("Descarcă Python de pe **python.org/downloads** și instalează-l."),
  nota("**Foarte important pe Windows:** în prima fereastră a instalării bifează **„Add python.exe to PATH”**, apoi apasă **Install Now**. Fără bifa aceasta, VS Code și terminalul nu găsesc Python.", "C62828"),
  pas(2, "Visual Studio Code"),
  p("Descarcă VS Code de pe **code.visualstudio.com** și instalează-l."),
  pas(3, "Extensia Python pentru VS Code"),
  p("În VS Code, apasă iconița **Extensions** din bara din stânga (patru pătrățele) sau " + tasta("Ctrl+Shift+X") + " (pe Mac " + tasta("Cmd+Shift+X") + "), caută **Python** și instalează extensia făcută de **Microsoft**. Ea aduce și **Python Debugger**, necesar pentru pornirea cu F5."),
  p("Când deschizi proiectul, VS Code poate afișa în colțul din dreapta jos mesajul că proiectul recomandă aceste extensii. Apasă **Install**."),
  pas(4, "Git (opțional)"),
  p("Doar dacă vrei să iei proiectul direct de pe GitHub din VS Code: descarcă-l de pe **git-scm.com** și instalează-l cu opțiunile implicite. Dacă nu vrei Git, poți descărca proiectul ca arhivă ZIP (pasul 5, varianta B)."),
];

const proiect = [
  t1("Partea 2. Deschizi proiectul"),
  pas(5, "Iei proiectul pe calculator"),
  t2("Varianta A – cu Git, direct din VS Code"),
  ...nr([
    "Apasă " + tasta("Ctrl+Shift+P") + " (pe Mac " + tasta("Cmd+Shift+P") + "). Se deschide **Command Palette**, bara de comenzi din partea de sus.",
    "Scrie **Git: Clone** și apasă Enter.",
    "Lipește adresa **https://github.com/cub-lab/Erasmus.git** și apasă Enter.",
    "Alege un folder (de exemplu *Documente*), apoi apasă **Open** când VS Code întreabă dacă deschide proiectul.",
  ]),
  t2("Varianta B – fără Git, ca arhivă ZIP"),
  ...nr([
    "Deschide în browser **github.com/cub-lab/Erasmus**.",
    "Apasă butonul verde **Code**, apoi **Download ZIP**.",
    "Dezarhivează fișierul (clic dreapta → *Extract All* pe Windows; dublu clic pe Mac).",
    "În VS Code: **File → Open Folder…** și alege folderul dezarhivat.",
  ]),
  nota("Deschide **folderul care conține direct `app.py`**, nu un folder de deasupra lui. În panoul **Explorer** din stânga trebuie să vezi `app.py`, `logica.py`, `intrebari.json`, `tests` etc."),
  p("Dacă VS Code întreabă **„Do you trust the authors of the files in this folder?”**, apasă **Yes, I trust the authors**. Altfel nu poate rula codul."),

  pas(6, "Creezi mediul virtual și instalezi bibliotecile"),
  p("Mediul virtual (folderul `.venv`) este un Python separat, doar pentru acest proiect, în care se instalează **Streamlit** și **pytest**. Se face o singură dată."),
  ...nr([
    "Apasă " + tasta("Ctrl+Shift+P") + " (pe Mac " + tasta("Cmd+Shift+P") + ") și scrie **Python: Create Environment**.",
    "Alege **Venv**.",
    "Alege versiunea de Python instalată (3.10 sau mai nouă).",
    "Bifează **requirements.txt** când VS Code întreabă ce dependențe să instaleze, apoi apasă **OK**.",
    "Așteaptă 1–2 minute. În dreapta jos apare un mesaj de progres; la final, în Explorer apare folderul `.venv`.",
  ]),
  p("În bara de jos a VS Code (dreapta) trebuie să apară acum ceva de genul **3.12.x ('.venv': venv)**. Înseamnă că proiectul folosește mediul virtual."),
  t2("Alternativ, din terminal"),
  p("Deschide terminalul din VS Code cu **Terminal → New Terminal** (sau " + tasta("Ctrl+`") + ") și scrie:"),
  windowsMac("`python -m venv .venv`\n`.venv\\Scripts\\python -m pip install -r requirements.txt`",
             "`python3 -m venv .venv`\n`.venv/bin/python -m pip install -r requirements.txt`"),
  spatiu(),
  p("Apoi alege interpretorul: " + tasta("Ctrl+Shift+P") + " → **Python: Select Interpreter** → cel care conține **.venv**."),
];

const pornire = [
  t1("Partea 3. Pornești aplicația"),
  pas(7, "Varianta simplă: tasta F5"),
  ...nr([
    "Apasă iconița **Run and Debug** din bara din stânga (triunghi cu gândăcel) sau " + tasta("Ctrl+Shift+D") + " (pe Mac " + tasta("Cmd+Shift+D") + ").",
    "Din lista de sus alege **LogicLab: pornește aplicația**.",
    "Apasă " + tasta("F5") + " (sau butonul verde ▶).",
  ]),
  p("În panoul de jos apare mesajul **„You can now view your Streamlit app in your browser”**, iar browserul se deschide la **http://localhost:8501**. Dacă nu se deschide singur, copiază adresa în browser."),
  pas(8, "Varianta din terminal"),
  p("În terminalul din VS Code (" + tasta("Ctrl+`") + "):"),
  windowsMac("`.venv\\Scripts\\python -m streamlit run app.py`", "`.venv/bin/python -m streamlit run app.py`"),
  spatiu(),
  p("Dacă terminalul arată deja **(.venv)** la începutul rândului, ajunge și comanda scurtă: `streamlit run app.py`."),
  pas(9, "Oprești aplicația"),
  li("Dacă ai pornit-o cu F5: butonul roșu **■ Stop** din bara de depanare sau " + tasta("Shift+F5") + "."),
  li("Dacă ai pornit-o din terminal: apasă " + tasta("Ctrl+C") + " în terminal (și pe Mac tot Ctrl+C)."),

  t1("Partea 4. Rulezi testele"),
  li("**Din panoul Testing:** apasă iconița cu **eprubetă** din stânga, apoi ▶ **Run Tests**. Fiecare test apare cu ✓ verde sau ✗ roșu."),
  li("**Cu F5:** în Run and Debug alege **LogicLab: rulează testele**, apoi F5."),
  li("**Din terminal:** `.venv\\Scripts\\python -m pytest` (Windows) sau `.venv/bin/python -m pytest` (macOS)."),
  p("Rezultatul corect se termină cu **„60 passed”**."),

  t1("Partea 5. Cum lucrezi zilnic"),
  ...nr([
    "Deschizi VS Code; proiectul se redeschide singur (altfel **File → Open Recent**).",
    "Apeși **F5**. Aplicația pornește în câteva secunde.",
    "Modifici un fișier și îl salvezi (" + tasta("Ctrl+S") + " / " + tasta("Cmd+S") + "). În browser, sus în dreapta, apasă **Rerun** (sau alege **Always rerun**).",
    "Dacă ai modificat `logica.py`, `evaluare.py`, `lectii.py` sau `aplicatii.py`, **oprește și repornește** aplicația (Shift+F5, apoi F5): Streamlit reîncarcă automat doar `app.py`.",
    "Înainte să trimiți modificările pe GitHub, rulezi testele.",
  ]),
];

const probleme = [
  t1("Partea 6. Probleme frecvente"),
  tabel(["Ce vezi", "Cauza", "Soluția"], [
    ["„python is not recognized…” sau „command not found”", "Python nu e instalat sau nu e în PATH", "Reinstalează Python și bifează „Add python.exe to PATH” (Windows). Pe Mac folosește `python3`."],
    ["„No module named streamlit”", "Mediul virtual nu e creat sau nu e ales", "Refă pasul 6 și verifică în bara de jos că apare **.venv**."],
    ["Pe Windows: „running scripts is disabled on this system”", "PowerShell nu permite activarea mediului virtual", "Nu e nevoie de activare: folosește comenzile cu `.venv\\Scripts\\python -m …` sau pornește cu F5."],
    ["F5 nu găsește „LogicLab: pornește aplicația”", "Nu ai deschis folderul corect sau lipsește extensia Python", "Deschide folderul care conține `app.py` și `.vscode`; instalează extensia Python."],
    ["„Port 8501 is already in use”", "Aplicația rulează deja (de exemplu, într-un alt terminal)", "Oprește instanța veche (Ctrl+C / Shift+F5) sau deschide direct http://localhost:8501."],
    ["Eroare ciudată după o modificare („has no attribute…”)", "Streamlit a păstrat în memorie versiunea veche a unui fișier", "Oprește și repornește aplicația."],
    ["Pagina rămâne la „Connecting…”", "Aplicația s-a oprit", "Uită-te în terminal după mesajul de eroare și repornește cu F5."],
  ], [3200, 3000, 3438]),
  spatiu(),
  t1("Fișă rapidă"),
  tabel(["Ce vrei", "Cum"], [
    ["Pornești aplicația", "**F5** (configurarea „LogicLab: pornește aplicația”)"],
    ["Oprești aplicația", "**Shift+F5** sau **Ctrl+C** în terminal"],
    ["Rulezi testele", "Panoul **Testing** → Run Tests"],
    ["Deschizi terminalul", "**Ctrl+`**"],
    ["Bara de comenzi", "**Ctrl+Shift+P** (Mac: **Cmd+Shift+P**)"],
    ["Adresa aplicației locale", "**http://localhost:8501**"],
    ["Aplicația publicată", "**erasmus99.streamlit.app**"],
  ], [3600, 6038]),
];

const doc = new Document({
  creator: "BASALIC Mihai",
  title: "LogicLab – Cum pornești aplicația în VS Code",
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 30, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0, keepNext: true,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "B7C4D3", space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 23, bold: true, color: "333333" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: { config: [
    { reference: "puncte", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] },
    { reference: "numere", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "LogicLab – pornirea în VS Code · Pagina ", size: 16, color: GRI }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRI })] })] }) },
    children: [...antet, ...instalare, ...proiect, ...pornire, ...probleme],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(IESIRE, buf);
  console.log("scris:", IESIRE, Math.round(buf.length / 1024), "KB");
});
