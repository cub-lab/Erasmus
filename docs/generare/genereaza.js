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
// CONȚINUT
// =====================================================================
const copertaLinie = (eticheta, valoare) => new TableRow({ children: [
  new TableCell({ width: { size: 3000, type: WidthType.DXA }, margins: margini, borders: chenare, shading: { type: ShadingType.CLEAR, fill: FUNDAL_TABEL, color: "auto" }, children: [new Paragraph({ children: [new TextRun({ text: eticheta, bold: true })] })] }),
  new TableCell({ width: { size: 6638, type: WidthType.DXA }, margins: margini, borders: chenare, children: [new Paragraph({ children: runs(valoare) })] }),
] });

const coperta = [
  new Paragraph({ spacing: { before: 2200 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "RESURSĂ EDUCAȚIONALĂ DESCHISĂ", bold: true, size: 22, color: GRI, characterSpacing: 40 })] }),
  new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: "LogicLab", bold: true, size: 88, color: ACCENT })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Propoziții compuse și aplicațiile lor în informatică", size: 34, color: "333333" })] }),
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } }, spacing: { after: 480 },
    children: [new TextRun({ text: "Manual de utilizare și documentația proiectului", size: 28, italics: true, color: GRI })] }),
  new Table({ width: { size: LATIME, type: WidthType.DXA }, columnWidths: [3000, 6638], layout: TableLayoutType.FIXED, rows: [
    copertaLinie("Autor", "BASALIC Mihai, elev în clasa a IX-a"),
    copertaLinie("Unitatea de învățământ", "Colegiul Național Militar „Tudor Vladimirescu”"),
    copertaLinie("Discipline", "Matematică (Mulțimi și elemente de logică matematică); Logică, argumentare și comunicare; Informatică"),
    copertaLinie("Public țintă", "Elevi de clasa a IX-a și profesorii lor"),
    copertaLinie("Aplicația", "erasmus99.streamlit.app"),
    copertaLinie("Codul sursă", "github.com/cub-lab/Erasmus"),
    copertaLinie("Licență", "Conținut: CC BY-SA 4.0 · Cod: MIT"),
    copertaLinie("Data", "Septembrie 2026"),
  ] }),
  new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "Document realizat pentru proba de informatică a selecției Erasmus: o resursă educațională deschisă pentru sprijinirea învățării personalizate.", size: 20, color: GRI, italics: true })] }),
];

const cuprins = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Cuprins")] }),
  new TableOfContents("Cuprins", { hyperlink: true, headingStyleRange: "1-2" }),
  nota("Dacă cuprinsul apare gol, dați clic dreapta pe el și alegeți **Actualizare câmp** (Update Field), apoi **Actualizare tabel întreg**."),
];

// ---------- 1. Prezentare ----------
const prezentare = [
  h1("1. Prezentarea resursei"),
  p("**LogicLab** este o aplicație web gratuită prin care elevii de clasa a IX-a învață **propozițiile compuse** din logica matematică și văd unde se folosesc în informatică. Fiecare elev lucrează în ritmul lui: un test inițial îl încadrează pe un nivel, lecțiile și exercițiile îi arată imediat dacă a răspuns corect, iar testele finale îi spun exact ce teme să recitească."),
  h2("1.1 Ce problemă rezolvă"),
  p("Într-o clasă, elevii au niveluri diferite: unii stăpânesc deja tabelele de adevăr, alții încurcă implicația cu echivalența. LogicLab permite fiecăruia să pornească de la nivelul lui și primește **feedback personalizat**, fără ca profesorul să corecteze manual fiecare test."),
  h2("1.2 Ce conține"),
  tabel(["Secțiune", "Ce face elevul acolo"], [
    ["🏠 Acasă", "Citește prezentarea și obiectivele, pornește testul de încadrare"],
    ["🧭 Test de încadrare", "Răspunde la 6 întrebări și este încadrat la Nivel 1 sau Nivel 2"],
    ["📖 Lecții", "Parcurge 10 lecții scurte, fiecare cu definiție, tabel de adevăr, exemplu și exercițiu"],
    ["🧮 Generator de tabele de adevăr", "Scrie o expresie cu p, q, r și primește tabelul complet și tipul expresiei"],
    ["💡 Unde se folosește?", "Explorează 6 demonstrații: porți logice, if, parole, SQL, criptare XOR, sistem expert"],
    ["📝 Teste pe niveluri", "Dă un test de 10 întrebări și primește scorul și recomandări pe teme"],
    ["ℹ️ Despre această resursă", "Citește fișa resursei: licență, autor, instrucțiuni, bibliografie"],
  ], [3000, 6638]),
  spatiu(),
  h2("1.3 Obiective de învățare"),
  p("La finalul activității, elevul va putea:"),
  ...nr([
    "să deosebească o propoziție simplă de una compusă și să îi stabilească valoarea de adevăr (1/0);",
    "să calculeze valoarea de adevăr a propozițiilor compuse cu ¬, ∧, ∨, →, ↔, ⊕;",
    "să construiască tabelul de adevăr al unei expresii și să spună dacă este tautologie, contradicție sau realizabilă;",
    "să aplice legile lui De Morgan și regulile Modus Ponens și Modus Tollens;",
    "să recunoască logica propozițiilor în condiții `if`, reguli de validare, interogări SQL, porți logice și criptarea XOR.",
  ]),
  h2("1.4 Cum se accesează"),
  li("Aplicația se deschide în orice browser, pe calculator, tabletă sau telefon."),
  li("**Nu necesită cont, parolă sau plată** și nu colectează date personale."),
  li("Progresul (nivelul, scorurile) se păstrează doar cât timp pagina este deschisă. La reîncărcare, aplicația pornește de la zero."),
  li("Adresa aplicației: **erasmus99.streamlit.app**."),
  li("Codul sursă este public: **github.com/cub-lab/Erasmus**."),
];

// ---------- 2. Ghid pentru elevi ----------
const ghid = [
  h1("2. Ghid de utilizare pentru elevi"),
  p("Meniul din bara laterală (stânga) duce la toate secțiunile. Pe telefon, meniul se deschide cu butonul » din colțul din stânga sus. Ordinea recomandată este: **test de încadrare → lecții → generator → aplicații → test pe nivel**."),

  h2("2.1 Pagina Acasă"),
  p("Prima pagină prezintă resursa, obiectivele de învățare și licența. Butonul roșu **Începe testul de încadrare** duce direct la test. După încadrare, butonul devine **Continuă cu testul de Nivel X**, iar nivelul apare în bara laterală."),
  ...figura("acasa_pc", "Pagina Acasă, cu meniul din bara laterală și nivelul elevului încă nestabilit"),

  h2("2.2 Testul de încadrare"),
  p("Testul are **6 întrebări**, alese aleator dintr-o bancă de 18: **câte una din fiecare temă** de bază. La „Reia încadrarea” se aleg alte întrebări. Elevul bifează câte un răspuns la fiecare și apasă **Vezi rezultatul**. Dacă a omis o întrebare, aplicația îi cere să le completeze pe toate."),
  ...figura("incadrare_pc", "Testul de încadrare: toate întrebările pe o singură pagină", 12, 19.5),
  p("La rezultat, elevul vede scorul, nivelul la care a fost încadrat și corectarea fiecărei întrebări (✅ corect / ❌ greșit, cu explicație). Butonul principal pornește direct testul potrivit nivelului."),
  ...figura("incadrare_rezultat_pc", "Rezultatul încadrării: 5 din 6 (83%), deci Nivel 2 – Avansat", 12.5, 19.5),

  h2("2.3 Lecțiile"),
  p("Lecția se alege din lista de sus. Lecțiile de Nivel 2 sunt marcate cu „(Nivel 2)”, dar sunt deschise tuturor. Fiecare lecție are aceeași structură:"),
  li("**Obiectiv**: ce va ști elevul la final;"),
  li("**Definiție**, **simbol**, cum se scrie în LogicLab, **alte notații** (cele folosite la Logică: &, v, w, ≡) și **cuvintele** care exprimă operatorul;"),
  li("**Tabelul de adevăr**, calculat automat de motorul logic (nu scris de mână, deci fără greșeli);"),
  li("un **exemplu din viața reală**;"),
  li("un **exercițiu cu verificare imediată**: ✅ corect sau ❌ greșit, cu explicație."),
  ...figura("lectie_pc", "Lecția „Implicația”, cu exercițiul rezolvat corect", 10.5, 20),
  tabel(["Nivel", "Lecții"], [
    ["Nivel 1", "Propoziții simple și compuse · Negația · Conjuncția · Disjuncția · Implicația · Echivalența · Disjuncția exclusivă (XOR)"],
    ["Nivel 2", "Legile lui De Morgan · Tautologii și contradicții · Modus Ponens și Modus Tollens"],
  ], [1800, 7838]),
  spatiu(),

  h2("2.4 Generatorul de tabele de adevăr"),
  p("Elevul scrie o expresie în căsuța **Expresia ta** și apasă Enter. Aplicația afișează tabelul de adevăr complet, numărul de rânduri (2ⁿ) și tipul expresiei: **tautologie** (mereu 1), **contradicție** (mereu 0) sau **realizabilă**. Secțiunea „Vezi cum o înțelege Python” arată traducerea expresiei în cod."),
  ...figura("generator_pc", "Generatorul: (p → q) ↔ (¬q → ¬p) este o tautologie", 13, 19.5),
  h3("Cum se scriu expresiile"),
  tabel(["Operator", "În matematică", "În LogicLab", "Exemplu"], [
    ["Negația", "¬p", "`not`", "`not p`"],
    ["Conjuncția", "p ∧ q", "`and`", "`p and q`"],
    ["Disjuncția", "p ∨ q", "`or`", "`p or q`"],
    ["Implicația", "p → q", "`->`", "`p -> q`"],
    ["Echivalența", "p ↔ q", "`<->`", "`p <-> q`"],
    ["Disjuncția exclusivă", "p ⊕ q", "`xor`", "`p xor q`"],
    ["Constante", "1 / 0", "`1`, `0`", "`p and 1`"],
  ], [2300, 2000, 2000, 3338]),
  spatiu(),
  p("Se pot folosi variabilele **p, q, r** și paranteze. Literele mari sunt acceptate (P AND Q)."),
  nota("**Regula parantezelor.** În jurul lui `->`, `<->` și `xor`, părțile compuse se pun între paranteze: se scrie `(p and q) -> r`, nu `p and q -> r`. Regula elimină orice neclaritate despre ordinea calculului (explicația tehnică este în capitolul 6)."),
  p("Când expresia are o greșeală, mesajul spune clar ce e greșit și, când poate, ce a vrut elevul să scrie:"),
  ...figura("generator_eroare_pc", "Simbol necunoscut: aplicația sugerează varianta corectă", 14, 4),
  ...figura("generator_paranteze_pc", "Regula parantezelor, explicată chiar în mesajul de eroare", 14, 4),

  h2("2.5 Unde se folosește? – aplicații în informatică"),
  p("Secțiunea are **6 demonstrații interactive**, fiecare într-un tab. Scopul lor este să arate că logica de la ora de matematică este chiar logica după care funcționează calculatoarele."),
  h3("Porți logice"),
  p("Două întrerupătoare (A și B) și un selector AND / OR / XOR / NOT. Becul se aprinde (💡) sau se stinge (⚫), iar dedesubt apare calculul, de exemplu `1 ⊕ 0 = 1`."),
  ...figura("porti_pc", "Poarta XOR cu A = 1 și B = 0: becul este aprins", 13, 12),
  h3("Programare: instrucțiunea if"),
  p("Elevul bifează `utilizator_logat` și `are_permisiune` și vede dacă pagina se afișează. Codul Python afișat se schimbă odată cu valorile."),
  ...figura("if_pc", "Condiția if: utilizator logat, dar fără permisiune, deci acces interzis", 13, 14),
  h3("Validarea parolelor"),
  p("Parola este verificată pe loc după trei reguli (p: minimum 8 caractere, q: o literă mare, r: o cifră). Fiecare regulă apare cu ✅ sau ❌, apoi expresia compusă p ∧ q ∧ r."),
  ...figura("parole_pc", "Parola „logica2026” este respinsă: îi lipsește litera mare", 13, 14),
  h3("Baze de date (SQL)"),
  p("O listă de 10 elevi fictivi se filtrează după oraș și vârstă, cu AND sau OR. Tabelul arată pentru fiecare elev valorile lui p și q, iar dedesubt apar interogarea SQL și condiția Python echivalentă."),
  ...figura("sql_pc", "Filtrul oras = 'București' AND varsta > 15", 10.5, 20),
  h3("Criptografie XOR"),
  p("Un cuvânt este criptat cu o cheie prin XOR, bit cu bit. Aplicația arată codul binar al fiecărei litere, textul criptat și decriptarea: aplicând XOR de două ori cu aceeași cheie se obține textul inițial."),
  ...figura("xor_pc", "Cuvântul LOGICA criptat cu cheia K și decriptat", 11, 19),
  h3("Sistem expert și argumentare"),
  p("Pentru o regulă de tipul „Dacă p și q, atunci r”, elevul spune ce știe (Da / Nu / Nu știu). Sistemul deduce concluzia și **numește regula de raționament**: Modus Ponens, Modus Tollens, Modus Tollens + De Morgan. Recunoaște și greșeala frecventă „am concluzia, deci am și ipoteza”."),
  ...figura("expert_pc", "Plouă și nu am umbrelă, deci „mă ud” (Modus Ponens)", 12, 18),

  h2("2.6 Testele pe niveluri"),
  p("Elevul alege nivelul. **Nivelul 2 este blocat** 🔒 până când elevul este încadrat la Nivel 2 sau obține minimum 70% la testul de Nivel 1."),
  ...figura("teste_alegere_pc", "Alegerea nivelului", 14, 9),
  p("Testul are **10 întrebări alese aleator**, afișate pe rând. Elevul alege un răspuns, apasă **Verifică răspunsul** și vede imediat dacă a răspuns corect și de ce. După verificare, răspunsul nu mai poate fi schimbat."),
  ...figura("test_corect_pc", "Răspuns corect, cu explicație", 13, 12),
  ...figura("test_gresit_pc", "Răspuns greșit: aplicația arată răspunsul corect și explicația", 13, 12),
  p("La final, elevul primește scorul, un mesaj de încurajare și **feedback personalizat pe teme**: pentru fiecare temă greșită, un mesaj de tipul „Ai greșit 1 din 2 întrebări despre tautologii și contradicții. Recitește lecția «Tautologii și contradicții».” Butonul **Deschide** duce direct la lecția recomandată."),
  ...figura("test_rezultat_a_pc", "Rezultatul testului și recomandările pe teme", 11.5, 17),
  p("Mai jos se află rezultatele pe teme și corectarea tuturor întrebărilor. Butonul **Reia testul** alege **alte întrebări** decât cele din testul anterior."),
  ...figura("test_rezultat_b_pc", "Rezultatele pe teme, corectarea întrebărilor și butonul Reia testul", 11.5, 17),

  h2("2.7 Despre această resursă"),
  p("Ultima secțiune afișează fișa resursei educaționale deschise: autor, disciplină, competențe, obiective, scenariul de lecție, licență și bibliografie. Conținutul este citit din fișierul `fisa_RED.md`, deci se schimbă odată cu el."),
];

// ---------- 3. Mobil ----------
const mobil = [
  h1("3. Varianta pentru telefon"),
  p("Aplicația se adaptează automat la ecranele mici. Pe telefon, meniul lateral se ascunde și se deschide cu butonul » din stânga sus. Tabelele, butoanele și exercițiile se așază pe o singură coloană. Textul are 18 px, mai mare decât implicit, ca să se citească ușor."),
  randTelefoane([["acasa_tel", "Acasă"], ["lectie_tel", "O lecție"], ["generator_tel", "Generatorul"]]),
  randTelefoane([["porti_tel", "Porți logice"], ["test_corect_tel", "O întrebare din test"], ["test_rezultat_tel", "Rezultatul testului"]]),
  nota("Pe telefon, după alegerea unei secțiuni, meniul lateral rămâne deschis și se închide cu «. Este comportamentul standard al bibliotecii Streamlit."),
];

// ---------- 4. Regulile aplicației ----------
const reguli = [
  h1("4. Regulile aplicației"),
  p("Toate regulile de mai jos sunt scrise în cod ca valori clare (de exemplu `PRAG_INCADRARE = 60` în `evaluare.py`), deci pot fi verificate și modificate ușor."),
  h2("4.1 Învățarea personalizată"),
  tabel(["Regulă", "Valoare / comportament"], [
    ["Testul de încadrare", "6 întrebări alese aleator din 18, **câte una din fiecare temă**; la reluare se aleg altele"],
    ["Încadrarea", "Sub 60% → **Nivel 1 – Începător**\nMinimum 60% (4 din 6) → **Nivel 2 – Avansat**"],
    ["Testele pe niveluri", "**10 întrebări** alese aleator din aproximativ 40 ale nivelului; temele se iau pe rând"],
    ["Variantele de răspuns", "La întrebările grilă, ordinea variantelor se amestecă la fiecare test"],
    ["Deblocarea Nivelului 2", "Dacă elevul a fost încadrat direct la Nivel 2 **sau** a obținut **minimum 70%** la Nivel 1. Aplicația reține cel mai bun scor la Nivel 1."],
    ["Verificarea răspunsului", "Imediat, după fiecare întrebare: ✅/❌ și explicație. După verificare, răspunsul se blochează."],
    ["Reia testul", "Alege întrebări pe care elevul **nu le-a văzut încă** în sesiune; abia după ce le-a văzut pe toate, o ia de la capăt"],
    ["Feedback pe teme", "Pentru fiecare temă cu greșeli: „Ai greșit X din Y întrebări despre … Recitește lecția «…»”, ordonat de la tema cu cele mai multe greșeli"],
    ["Mesaj după scor", "≥ 90% excelent · ≥ 70% foarte bine · ≥ 50% pe drumul cel bun · sub 50% mai exersează"],
    ["Lecțiile", "Deschise tuturor, indiferent de nivel"],
    ["Progresul", "Păstrat doar în sesiunea curentă (`st.session_state`), fără conturi sau baze de date"],
  ], [2900, 6738]),
  spatiu(),
  h2("4.2 Scrierea expresiilor în generator"),
  tabel(["Regulă", "Detalii"], [
    ["Simboluri permise", "`p q r and or not -> <-> xor ( ) 1 0` (și literele mari). Orice alt simbol este respins."],
    ["Regula parantezelor", "Un grup de paranteze care conține `->`, `<->` sau `xor` nu poate conține alt operator. `(p and q) -> r` este corect, `p and q -> r` nu."],
    ["Implicații înlănțuite", "`p -> q -> r` este respinsă; se scrie `p -> (q -> r)`"],
    ["Paranteze", "Trebuie să fie închise corect; parantezele goale `()` sunt respinse"],
    ["Mesaje prietenoase", "Pentru greșelile frecvente se sugerează varianta corectă: `&`, `∧`, `și` → `and`; `|`, `v`, `sau` → `or`; `!`, `~`, `¬` → `not`; `→` → `->`; `=`, `↔`, `≡` → `<->`; `^`, `⊕`, `w` → `xor`; `true`/`false` → `1`/`0`"],
    ["Variabile necunoscute", "„Nu recunosc variabila «x». Folosește doar variabilele p, q și r.”"],
  ], [2900, 6738]),
  spatiu(),
  h2("4.3 Banca de întrebări"),
  p("Banca are **99 de întrebări** (78 grilă, 21 adevărat/fals), verificate automat cu motorul logic acolo unde se poate. Elevul primește doar o parte, aleasă aleator, deci testele diferă de la o rulare la alta:"),
  tabel(["Tema", "Încadrare", "Nivel 1", "Nivel 2"], [
    ["Negația", "3", "5", "–"], ["Conjuncția", "3", "5", "–"], ["Disjuncția", "3", "5", "–"],
    ["Implicația", "3", "7", "4"], ["Echivalența", "–", "6", "–"], ["Disjuncția exclusivă (XOR)", "3", "5", "4"],
    ["Legile lui De Morgan", "3", "–", "7"], ["Tautologii și contradicții", "–", "–", "9"],
    ["Deducție (Modus Ponens / Tollens)", "–", "–", "7"], ["Aplicații (parole, if, SQL, porți, XOR, sistem expert)", "–", "7", "10"],
    ["**Total**", "**18**", "**40**", "**41**"],
  ], [4638, 1600, 1700, 1700]),
];

// ---------- 5. Ghid pentru profesori ----------
const profesori = [
  h1("5. Ghid pentru profesori"),
  h2("5.1 Scenariu de lecție (2 × 50 de minute)"),
  tabel(["Ora", "Activitate", "Durată"], [
    ["1", "Test de încadrare", "10 min"],
    ["1", "Lecții – fiecare elev pe nivelul lui", "25 min"],
    ["1", "Generatorul de tabele de adevăr: exerciții libere", "15 min"],
    ["2", "Unde se folosește? – cele 6 demonstrații, pe grupe", "20 min"],
    ["2", "Teste pe niveluri", "25 min"],
    ["2", "Discuție pe baza feedbackului primit", "5 min"],
  ], [1000, 6638, 2000]),
  spatiu(),
  h2("5.2 Cum se adaptează resursa"),
  li("**Întrebările** se modifică doar din fișierul `intrebari.json`, fără să se schimbe codul."),
  li("**Textele lecțiilor** se află în fișierul `lectii.py`."),
  li("**Pragurile** (60% la încadrare, 70% la deblocare) și **numărul de întrebări** (6 la încadrare, 10 pe test) sunt în primele rânduri din `evaluare.py`."),
  li("Comanda `pytest` verifică automat dacă întrebările și lecțiile sunt scrise corect."),
  h2("5.3 Cum se adaugă o întrebare nouă"),
  ...nr([
    "Deschideți `intrebari.json` într-un editor de text (Notepad++, VS Code sau direct pe GitHub, cu butonul ✏️).",
    "După acolada de închidere `}` a ultimei întrebări puneți o virgulă, apoi lipiți întrebarea nouă (modelul de mai jos). Fișierul trebuie să se termine tot cu `]`.",
    "Completați câmpurile conform tabelului.",
    "Rulați `pytest`: dacă lipsește o virgulă sau răspunsul corect nu este printre variante, testele arată unde este greșeala.",
    "Reporniți aplicația. Dacă este publicată pe GitHub, se actualizează singură după salvare.",
  ]),
  ...cod([
    "{",
    '  "id": 124,',
    '  "nivel": 1,',
    '  "tema": "conjuncția",',
    '  "tip": "grila",',
    '  "enunt": "Dacă p = 0 și q = 0, cât este p ∧ q?",',
    '  "variante": ["1", "0"],',
    '  "raspuns_corect": "0",',
    '  "explicatie": "Conjuncția este adevărată doar când ambele propoziții sunt adevărate."',
    "}",
  ]),
  tabel(["Câmp", "Ce se scrie"], [
    ["`id`", "Un număr nou, nefolosit. Convenție: 1–99 încadrare, 101–199 Nivel 1, 201–299 Nivel 2"],
    ["`nivel`", "`0` = încadrare, `1` = începător, `2` = avansat"],
    ["`tema`", "`negația`, `conjuncția`, `disjuncția`, `implicația`, `echivalența`, `xor`, `de_morgan`, `tautologii`, `deducție`, `aplicații`"],
    ["`tip`", "`grila` (o singură variantă corectă) sau `adevarat_fals` (variantele sunt exact „Adevărat” și „Fals”)"],
    ["`enunt`", "Textul întrebării"],
    ["`variante`", "Lista variantelor de răspuns"],
    ["`raspuns_corect`", "Exact textul uneia dintre variante"],
    ["`explicatie`", "Explicația afișată după răspuns"],
  ], [2400, 7238]),
  spatiu(),
  nota("Aplicația alege aleator **6** întrebări la încadrare (câte una pe temă) și **10** la testele pe niveluri. Cu cât banca e mai mare, cu atât testele seamănă mai puțin între ele. Recomandare: minimum 12 întrebări de încadrare, pe cel puțin 6 teme, și minimum 30 pe fiecare nivel."),
];

// ---------- 6. Documentație tehnică ----------
const tehnic = [
  h1("6. Documentație tehnică"),
  h2("6.1 Tehnologii"),
  tabel(["Tehnologie", "Rol în proiect"], [
    ["Python 3.10+", "Limbajul în care este scris tot proiectul"],
    ["Streamlit", "Biblioteca Python care transformă scriptul într-o pagină web interactivă (fără HTML/JavaScript scris manual)"],
    ["pytest", "Testele automate"],
    ["GitHub", "Păstrarea codului și publicarea lui"],
    ["Streamlit Community Cloud", "Găzduirea gratuită a aplicației"],
  ], [2900, 6738]),
  spatiu(),
  p("Proiectul nu folosește baze de date, conturi de utilizator sau servicii externe. Singurele biblioteci instalate sunt `streamlit` și `pytest`."),
  h2("6.2 Cum funcționează Streamlit"),
  p("Fiecare comandă `st.…` din cod pune un element pe pagină (`st.title` un titlu, `st.button` un buton, `st.table` un tabel). Când elevul apasă ceva, Streamlit **rulează din nou tot scriptul**, de sus până jos, cu noile valori. Informațiile care trebuie păstrate între rulări (nivelul, scorul, testul în desfășurare) se țin în `st.session_state`, „memoria” sesiunii."),
  h2("6.3 Structura proiectului"),
  tabel(["Fișier", "Conținut", "Rânduri"], [
    ["`app.py`", "Interfața: bara laterală, paginile Acasă, încadrare, lecții, generator, teste, despre", "624"],
    ["`logica.py`", "Motorul logic: validare, traducere, tabele de adevăr, clasificare", "230"],
    ["`lectii.py`", "Conținutul celor 10 lecții", "299"],
    ["`evaluare.py`", "Logica testelor: alegerea întrebărilor, scor, niveluri, feedback pe teme", "202"],
    ["`aplicatii.py`", "Cele 6 demonstrații din „Unde se folosește?”", "460"],
    ["`intrebari.json`", "Banca de întrebări (editabilă de profesori)", "–"],
    ["`fisa_RED.md`", "Fișa resursei educaționale deschise", "–"],
    ["`tests/`", "Testele automate (4 fișiere, 60 de teste)", "–"],
    ["`.streamlit/config.toml`", "Setări: mărimea textului, fără statistici de utilizare", "–"],
    ["`deploy/`", "Fișiere pentru publicarea pe o mașină virtuală (nginx, systemd)", "–"],
    ["`README.md`, `LICENSE`", "Descrierea proiectului și licențele", "–"],
  ], [2700, 5638, 1300]),
  spatiu(),
  p("Partea de calcul (`logica.py`, `evaluare.py`, funcțiile de calcul din `aplicatii.py`) este separată de partea de afișare. Așa, fiecare funcție de calcul poate fi testată singură, fără interfață."),
  h2("6.4 Motorul logic și siguranța"),
  p("Expresia scrisă de elev nu se execută direct. Programul o verifică în patru pași:"),
  ...nr([
    "**Împărțirea în simboluri** (tokeni): `(p and q) -> r` devine `( p and q ) -> r`.",
    "**Validarea**: fiecare simbol trebuie să fie în lista permisă. Aici se opresc orice încercări de cod periculos, de exemplu `import os`, `__import__('os')` sau `open('fisier')`. Se verifică și parantezele și regula de prioritate.",
    "**Traducerea în Python**: `->` devine `<=`, `<->` devine `==`, `xor` devine `!=`, iar `1`/`0` devin `True`/`False`.",
    "**Evaluarea**, abia după validare, fără acces la funcțiile Python: `eval(expresie, {\"__builtins__\": {}}, valori)`.",
  ]),
  tabel(["Logică", "Python", "De ce funcționează"], [
    ["p → q", "`p <= q`", "Pentru True/False, `p <= q` este fals doar pentru True <= False, exact ca implicația"],
    ["p ↔ q", "`p == q`", "Adevărat când p și q au aceeași valoare"],
    ["p ⊕ q", "`p != q`", "Adevărat când p și q au valori diferite"],
  ], [1600, 1800, 6238]),
  spatiu(),
  p("**De ce e nevoie de regula parantezelor:** în Python, `<=`, `==` și `!=` sunt operatori de comparație, cu altă prioritate decât în logică. De exemplu, `not p <= q` ar însemna în Python `not (p <= q)`, iar `p and q <= r` ar însemna `p and (q <= r)`. Cerând paranteze, aplicația garantează că elevul primește exact tabelul expresiei pe care a gândit-o."),
  p("Funcțiile motorului logic:"),
  tabel(["Funcție", "Ce face"], [
    ["`valideaza(expresie)`", "Întoarce (corectă, mesaj), de exemplu (False, „Nu recunosc simbolul «&»…”)"],
    ["`traduce(expresie)`", "Transformă expresia în cod Python"],
    ["`variabile_folosite(expresie)`", "Lista variabilelor, de exemplu [\"p\", \"r\"]"],
    ["`tabel_adevar(expresie)`", "Toate combinațiile de valori (cu `itertools.product`) și rezultatul fiecăreia"],
    ["`clasifica(expresie)`", "„tautologie”, „contradicție” sau „realizabilă”"],
  ], [3300, 6338]),
  spatiu(),
  h2("6.5 Testarea"),
  p("Proiectul are **60 de teste automate**, care trec toate. Se rulează cu o singură comandă: `pytest`."),
  tabel(["Fișier", "Teste", "Ce verifică"], [
    ["`test_logica.py`", "28", "Fiecare operator, legile lui De Morgan, tautologii, contradicții, respingerea codului periculos, parantezele, mesajele de eroare"],
    ["`test_intrebari.py`", "19", "Structura băncii de întrebări și **răspunsul corect al întrebărilor, recalculat cu motorul logic**; alegerea aleatoare pe teme, fără repetări, variantele amestecate, încadrarea, deblocarea, feedbackul"],
    ["`test_lectii.py`", "6", "Expresiile și tabelele din lecții, răspunsurile exercițiilor, legile prezentate sunt tautologii"],
    ["`test_aplicatii.py`", "7", "Porțile logice, parolele, filtrul SQL, criptarea XOR, deducțiile sistemului expert"],
  ], [2400, 900, 6338]),
  spatiu(),
  p("Pe lângă testele automate, aplicația a fost verificată prin **simularea unui elev** care parcurge toate secțiunile, pe calculator și pe telefon, și prin **13 încercări de atac** asupra generatorului (toate respinse)."),
  h2("6.6 Confidențialitate"),
  li("Aplicația nu cere și nu salvează nume, e-mail sau alte date personale."),
  li("Nu există conturi, baze de date sau fișiere în care să se scrie răspunsurile elevilor."),
  li("Statisticile de utilizare pe care Streamlit le-ar trimite implicit sunt **dezactivate** (`gatherUsageStats = false`)."),
];

// ---------- 7. Principii de dezvoltare ----------
const principii = [
  h1("7. Principiile după care a fost construit proiectul"),
  p("Proiectul a fost construit după un set de reguli stabilite de la început, scrise în fișierul de instrucțiuni al proiectului:"),
  tabel(["Principiu", "Cum a fost respectat"], [
    ["Codul poate fi explicat de un elev de clasa a IX-a", "Funcții scurte, nume de variabile în română, fără clase, fără decoratori, fără programare asincronă. Unde exista o variantă simplă și una „elegantă”, a fost aleasă cea simplă."],
    ["Totul în limba română, cu diacritice", "Textele, mesajele și comentariile din cod sunt în română. Diacriticele au fost verificate automat (inclusiv forma corectă ș/ț cu virgulă, nu cu sedilă)."],
    ["Cod comentat", "Fiecare fișier și fiecare funcție are o explicație, ca fiecare parte să poată fi prezentată în fața comisiei"],
    ["Fără dependențe inutile", "Doar `streamlit` și `pytest`; fără baze de date, conturi sau API-uri externe"],
    ["Fără `eval()` nesigur", "Expresiile sunt validate simbol cu simbol înainte de evaluare (capitolul 6.4)"],
    ["Construire pe etape", "După fiecare etapă: aplicația a fost rulată, verificată și explicată"],
  ], [3300, 6338]),
  spatiu(),
  h2("7.1 Etapele de lucru"),
  tabel(["Etapa", "Conținut", "Stare"], [
    ["1", "Structura proiectului, motorul logic (`logica.py`) și testele", "✅ Finalizată"],
    ["2", "Interfața (`app.py`), navigarea și pagina Acasă", "✅ Finalizată"],
    ["3", "Generatorul de tabele de adevăr", "✅ Finalizată"],
    ["4", "Lecțiile", "✅ Finalizată"],
    ["5", "Banca de întrebări, testul de încadrare, testele pe niveluri și feedbackul", "✅ Finalizată"],
    ["6", "Secțiunea „Unde se folosește?” (6 demonstrații)", "✅ Finalizată"],
    ["7", "README, fișa RED, licența, secțiunea „Despre”", "✅ Finalizată"],
    ["8", "Verificarea finală: diacritice, erori, teste, telefon, publicare", "✅ Finalizată"],
  ], [1000, 6638, 2000]),
];

// ---------- 8. Cerințe RED ----------
const red = [
  h1("8. Cerințele unei resurse educaționale deschise"),
  tabel(["Cerință", "Cum este îndeplinită"], [
    ["Licență deschisă", "Conținutul educațional (texte, întrebări) sub **CC BY-SA 4.0**, codul sub **MIT**. Ambele apar în `LICENSE`, în `README.md` și în subsolul aplicației."],
    ["Acces liber", "Fără cont, fără plată, fără date personale colectate"],
    ["Adaptabilitate", "Întrebările se modifică din `intrebari.json`, lecțiile din `lectii.py`; pașii sunt explicați pentru profesori (capitolul 5)"],
    ["Reutilizare", "Codul este public pe GitHub; oricine îl poate copia și adapta, menționând autorul"],
    ["Învățare personalizată", "Încadrare pe niveluri, deblocarea nivelului avansat, feedback pe teme cu trimitere la lecția potrivită"],
    ["Accesibilitate", "Text clar, mărit (18 px); informația nu depinde doar de culoare (✅/❌, 💡/⚫); funcționează pe telefon"],
    ["Fișa resursei", "`fisa_RED.md`: titlu, autor, disciplină, clasă, competențe, obiective, public țintă, durată, niveluri, cerințe tehnice, licență, instrucțiuni, bibliografie"],
  ], [2600, 7038]),
  spatiu(),
  h2("8.1 Cum se citează resursa"),
  nota("„LogicLab”, de BASALIC Mihai (Colegiul Național Militar „Tudor Vladimirescu”), licența CC BY-SA 4.0, github.com/cub-lab/Erasmus"),
];

// ---------- 9. Rulare și publicare ----------
const publicare = [
  h1("9. Rulare și publicare"),
  h2("9.1 Pe calculatorul propriu"),
  p("Este nevoie de Python 3.10 sau mai nou. În terminal, în folderul proiectului:"),
  ...cod([
    "python3 -m venv .venv",
    "source .venv/bin/activate        # pe Windows: .venv\\Scripts\\activate",
    "pip install -r requirements.txt",
    "streamlit run app.py             # se deschide la http://localhost:8501",
    "pytest                           # rulează testele",
  ]),
  h2("9.2 Pe internet (Streamlit Community Cloud)"),
  ...nr([
    "Codul se află în depozitul public **github.com/cub-lab/Erasmus**.",
    "Pe **share.streamlit.io**, autentificare cu contul GitHub.",
    "**Create app** → depozitul `cub-lab/Erasmus`, ramura `main`, fișierul `app.py` → **Deploy**.",
    "Se obține un link public, care poate fi trimis elevilor. LogicLab este publicată la **erasmus99.streamlit.app**.",
  ]),
  p("La fiecare modificare salvată pe GitHub, aplicația publicată se actualizează automat. Pentru publicarea pe un server propriu (de exemplu o mașină virtuală Azure), instrucțiunile se află în `deploy/INSTALARE_VM.md`."),
];

// ---------- 10. Licență și bibliografie ----------
const final = [
  h1("10. Licență și bibliografie"),
  h2("10.1 Licență"),
  li("**Conținutul educațional** (lecții, întrebări, texte, această documentație): Creative Commons Atribuire – Distribuire în condiții identice 4.0 Internațional (**CC BY-SA 4.0**). Poate fi copiat, modificat și distribuit, cu menționarea autorului și sub aceeași licență."),
  li("**Codul** (fișierele .py): licența **MIT**. Poate fi folosit liber, păstrând mențiunea de copyright."),
  h2("10.2 Bibliografie"),
  ...nr([
    "Manualul de Matematică pentru clasa a IX-a, capitolul „Mulțimi și elemente de logică matematică” (se completează autorii, editura și anul).",
    "Manualul de Logică, argumentare și comunicare pentru clasa a IX-a (se completează autorii, editura și anul).",
    "LOGICA, argumentare și comunicare – suport de curs, Colegiul „General Magheru”, 2017 (resursă educațională deschisă).",
    "The Open Logic Project, manual deschis de logică (CC BY): openlogicproject.org",
    "Documentația Python – Boolean Operations (and, or, not): docs.python.org",
    "Documentația Streamlit: docs.streamlit.io",
  ]),
];

// =====================================================================
const doc = new Document({
  creator: "BASALIC Mihai",
  title: "LogicLab – Manual de utilizare și documentație",
  description: "Manualul de utilizare și documentația resursei educaționale deschise LogicLab",
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
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
                  titlePage: true },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "LogicLab – Manual de utilizare și documentație", size: 17, color: GRI })] })] }),
      first: new Header({ children: [new Paragraph({ children: [] })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Pagina ", size: 17, color: GRI }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: GRI }),
        new TextRun({ text: " din ", size: 17, color: GRI }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: GRI }),
        new TextRun({ text: "   ·   CC BY-SA 4.0", size: 17, color: GRI })] })] }),
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
    },
    children: [...coperta, ...cuprins, ...prezentare, ...ghid, ...mobil, ...reguli, ...profesori, ...tehnic, ...principii, ...red, ...publicare, ...final],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(IESIRE, buf);
  console.log("scris:", IESIRE, Math.round(buf.length / 1024), "KB,", numarFigura, "figuri");
});
