"""
Conținutul lecțiilor din LogicLab (licența CC BY-SA 4.0).

Fiecare lecție este un dicționar cu:
  titlu, nivel (1 sau 2), tema (aceeași ca în intrebari.json),
  obiectiv, definitie, simbol, scriere (cum se scrie în LogicLab),
  alte_notatii – notații folosite la Logică, argumentare și comunicare (opțional),
  cuvinte    – cuvintele prin care se exprimă operatorul în limba română (opțional),
  tabel      – listă de perechi (expresie LogicLab, etichetă afișată);
               tabelul de adevăr este CALCULAT de logica.py, nu scris de mână,
  exemplu    – un exemplu din viața reală,
  exercitiu  – o întrebare cu variante, răspunsul corect și explicația.
"""

LECTII = [
    {
        "titlu": "Propoziții simple și compuse",
        "nivel": 1,
        "tema": "propoziții",
        "obiectiv": "Să deosebești o propoziție simplă de una compusă și să îi stabilești valoarea de adevăr.",
        "definitie": (
            "O **propoziție** este un enunț despre care putem spune clar dacă este adevărat sau fals. "
            "Valoarea de adevăr se notează cu **1** (adevărat) sau **0** (fals).\n\n"
            "- „5 este număr impar” este o propoziție adevărată (1).\n"
            "- „3 > 7” este o propoziție falsă (0).\n"
            "- „Închide ușa!” sau „Cât e ceasul?” **nu** sunt propoziții: nu pot fi adevărate sau false.\n\n"
            "O propoziție **compusă** este formată din:\n"
            "- **variabile propoziționale**, adică propozițiile simple, notate cu litere mici: p, q, r;\n"
            "- **operatori logici** (numiți și *constante logice*): „nu”, „și”, „sau”, "
            "„dacă… atunci”, „dacă și numai dacă”.\n\n"
            "Valoarea de adevăr a unei propoziții compuse depinde **doar** de valorile propozițiilor simple "
            "și de operatori. De aceea propozițiile compuse se mai numesc **funcții de adevăr**.\n\n"
            "📏 **Câte rânduri are un tabel de adevăr?** Fiecare variabilă poate fi 1 sau 0, deci pentru "
            "**n** variabile avem **2ⁿ** combinații: 1 variabilă → 2 rânduri, 2 variabile → 4 rânduri, "
            "3 variabile → 8 rânduri."
        ),
        "simbol": "p, q, r",
        "scriere": "p, q, r, 1, 0",
        "tabel": [],
        "exemplu": (
            "„Astăzi este luni **și** am oră de informatică” este o propoziție compusă, "
            "formată din p: „Astăzi este luni” și q: „Am oră de informatică”."
        ),
        "exercitiu": {
            "intrebare": "Care dintre următoarele enunțuri este o propoziție?",
            "variante": ["Deschide fereastra!", "10 este divizibil cu 3.", "Ce număr ai ales?"],
            "raspuns": "10 este divizibil cu 3.",
            "explicatie": "Enunțul „10 este divizibil cu 3” are o valoare de adevăr: este fals (0). "
                          "Un ordin sau o întrebare nu pot fi adevărate sau false.",
        },
    },
    {
        "titlu": "Negația",
        "nivel": 1,
        "tema": "negația",
        "obiectiv": "Să construiești negația unei propoziții și să îi afli valoarea de adevăr.",
        "definitie": (
            "**Negația** propoziției p este propoziția „non p”. "
            "Ea este adevărată când p este falsă și falsă când p este adevărată: "
            "negația **schimbă** valoarea de adevăr."
        ),
        "simbol": "¬p",
        "scriere": "not p",
        "alte_notatii": "~p, non-p",
        "cuvinte": "nu, nu este adevărat că, este fals că",
        "tabel": [("not p", "¬p")],
        "exemplu": "p: „Afară plouă.” → ¬p: „Afară **nu** plouă.” Dacă plouă (p = 1), atunci ¬p = 0.",
        "exercitiu": {
            "intrebare": "p: „5 este număr par”. Cât este valoarea lui ¬p?",
            "variante": ["1", "0"],
            "raspuns": "1",
            "explicatie": "p este falsă (5 este impar), deci p = 0, iar negația ei este ¬p = 1.",
        },
    },
    {
        "titlu": "Conjuncția",
        "nivel": 1,
        "tema": "conjuncția",
        "obiectiv": "Să afli valoarea de adevăr a unei conjuncții.",
        "definitie": (
            "**Conjuncția** propozițiilor p și q este propoziția „p **și** q”. "
            "Ea este adevărată **doar** când ambele propoziții sunt adevărate."
        ),
        "simbol": "p ∧ q",
        "scriere": "p and q",
        "alte_notatii": "p & q, p · q",
        "cuvinte": "și, iar, dar, totuși",
        "tabel": [("p and q", "p ∧ q")],
        "exemplu": (
            "„Poți ieși afară dacă ți-ai făcut temele **și** ți-ai strâns camera.” "
            "Dacă lipsește una dintre condiții, nu ieși."
        ),
        "exercitiu": {
            "intrebare": "Care este valoarea de adevăr a propoziției „2 < 3 și 3 < 1”?",
            "variante": ["1", "0"],
            "raspuns": "0",
            "explicatie": "„2 < 3” este adevărată, dar „3 < 1” este falsă. "
                          "Conjuncția e adevărată doar dacă ambele sunt adevărate, deci rezultatul este 0.",
        },
    },
    {
        "titlu": "Disjuncția",
        "nivel": 1,
        "tema": "disjuncția",
        "obiectiv": "Să afli valoarea de adevăr a unei disjuncții.",
        "definitie": (
            "**Disjuncția** propozițiilor p și q este propoziția „p **sau** q”. "
            "Ea este falsă **doar** când ambele propoziții sunt false. "
            "Atenție: „sau” din logică permite ca ambele să fie adevărate."
        ),
        "simbol": "p ∨ q",
        "scriere": "p or q",
        "alte_notatii": "p v q (disjuncție neexclusivă)",
        "cuvinte": "sau, ori, fie",
        "tabel": [("p or q", "p ∨ q")],
        "exemplu": (
            "„Primești reducere la bilet dacă ești elev **sau** ai peste 65 de ani.” "
            "Este suficient să îndeplinești una dintre condiții."
        ),
        "exercitiu": {
            "intrebare": "Care este valoarea de adevăr a propoziției „7 este număr prim sau 7 este număr par”?",
            "variante": ["1", "0"],
            "raspuns": "1",
            "explicatie": "„7 este prim” este adevărată. Pentru disjuncție ajunge ca o singură parte să fie adevărată.",
        },
    },
    {
        "titlu": "Implicația",
        "nivel": 1,
        "tema": "implicația",
        "obiectiv": "Să afli valoarea de adevăr a unei implicații și să recunoști ipoteza și concluzia.",
        "definitie": (
            "**Implicația** este propoziția „**dacă** p, **atunci** q”. "
            "p se numește **ipoteză** (sau **antecedent**), iar q **concluzie** (sau **consecvent**). "
            "Implicația este falsă **doar** când ipoteza este adevărată și concluzia este falsă.\n\n"
            "Dacă ipoteza este falsă, implicația este adevărată, oricare ar fi concluzia."
        ),
        "simbol": "p → q",
        "scriere": "p -> q",
        "alte_notatii": "p ⊃ q",
        "cuvinte": "dacă… atunci, implică, rezultă că",
        "tabel": [("p -> q", "p → q")],
        "exemplu": (
            "Promisiunea „**Dacă** iei 10 la test, **atunci** îți cumpăr o carte” este încălcată "
            "doar într-un caz: iei 10 și nu primești cartea. Dacă nu iei 10, promisiunea nu a fost încălcată."
        ),
        "exercitiu": {
            "intrebare": "Care este valoarea de adevăr a propoziției „Dacă 2 + 2 = 5, atunci Luna este pătrată”?",
            "variante": ["1", "0"],
            "raspuns": "1",
            "explicatie": "Ipoteza „2 + 2 = 5” este falsă. O implicație cu ipoteza falsă este întotdeauna adevărată.",
        },
    },
    {
        "titlu": "Echivalența",
        "nivel": 1,
        "tema": "echivalența",
        "obiectiv": "Să afli valoarea de adevăr a unei echivalențe.",
        "definitie": (
            "**Echivalența** este propoziția „p **dacă și numai dacă** q”. "
            "Ea este adevărată când p și q au **aceeași** valoare de adevăr (ambele 1 sau ambele 0)."
        ),
        "simbol": "p ↔ q",
        "scriere": "p <-> q",
        "alte_notatii": "p ≡ q",
        "cuvinte": "dacă și numai dacă, echivalent cu, exact atunci când",
        "tabel": [("p <-> q", "p ↔ q")],
        "exemplu": "„Un număr natural este par **dacă și numai dacă** ultima lui cifră este pară.”",
        "exercitiu": {
            "intrebare": "p: „4 este număr par”, q: „4 > 10”. Cât este p ↔ q?",
            "variante": ["1", "0"],
            "raspuns": "0",
            "explicatie": "p = 1 și q = 0 au valori diferite, deci echivalența este falsă.",
        },
    },
    {
        "titlu": "Disjuncția exclusivă (XOR)",
        "nivel": 1,
        "tema": "xor",
        "obiectiv": "Să deosebești „sau exclusiv” de „sau” obișnuit.",
        "definitie": (
            "**Disjuncția exclusivă** (XOR) este propoziția „**ori** p, **ori** q”. "
            "Ea este adevărată când **exact una** dintre propoziții este adevărată. "
            "Spre deosebire de „sau” obișnuit, este falsă când ambele sunt adevărate.\n\n"
            "Observă că p ⊕ q este exact negația echivalenței: ¬(p ↔ q)."
        ),
        "simbol": "p ⊕ q",
        "scriere": "p xor q",
        "alte_notatii": "p w q (disjuncție exclusivă)",
        "cuvinte": "ori… ori, fie… fie, sau… sau",
        "tabel": [("p xor q", "p ⊕ q"), ("p or q", "p ∨ q")],
        "exemplu": (
            "Lumina de pe scară, cu un întrerupător jos și unul sus: becul este aprins când întrerupătoarele "
            "sunt în poziții **diferite**. Oricare dintre ele ai apăsa, becul își schimbă starea."
        ),
        "exercitiu": {
            "intrebare": "Dacă p = 1 și q = 1, cât este p ⊕ q?",
            "variante": ["1", "0"],
            "raspuns": "0",
            "explicatie": "XOR este adevărat doar când exact una dintre propoziții este adevărată. "
                          "Aici sunt adevărate amândouă, deci rezultatul este 0.",
        },
    },
    {
        "titlu": "Legile lui De Morgan",
        "nivel": 2,
        "tema": "de_morgan",
        "obiectiv": "Să negi corect o conjuncție și o disjuncție.",
        "definitie": (
            "Legile lui De Morgan spun cum se neagă „și” și „sau”:\n\n"
            "- ¬(p ∧ q) are aceeași valoare ca ¬p ∨ ¬q\n"
            "- ¬(p ∨ q) are aceeași valoare ca ¬p ∧ ¬q\n\n"
            "Pe scurt: **negația intră în paranteză, iar „și” devine „sau” (și invers)**. "
            "În tabelul de mai jos, coloanele egale două câte două arată că legile sunt adevărate."
        ),
        "simbol": "¬(p ∧ q) ↔ (¬p ∨ ¬q)",
        "scriere": "(not (p and q)) <-> ((not p) or (not q))",
        "tabel": [
            ("not (p and q)", "¬(p ∧ q)"),
            ("(not p) or (not q)", "¬p ∨ ¬q"),
            ("not (p or q)", "¬(p ∨ q)"),
            ("(not p) and (not q)", "¬p ∧ ¬q"),
        ],
        "exemplu": (
            "„Nu este adevărat că am **și** pix **și** creion” înseamnă „nu am pix **sau** nu am creion”. "
            "În programare: `not (a and b)` este la fel cu `(not a) or (not b)`."
        ),
        "exercitiu": {
            "intrebare": "Care este negația propoziției „Plouă și este frig”?",
            "variante": ["Nu plouă și nu este frig.", "Nu plouă sau nu este frig.", "Plouă sau este frig."],
            "raspuns": "Nu plouă sau nu este frig.",
            "explicatie": "După De Morgan, ¬(p ∧ q) = ¬p ∨ ¬q: negăm fiecare parte, iar „și” devine „sau”.",
        },
    },
    {
        "titlu": "Tautologii și contradicții",
        "nivel": 2,
        "tema": "tautologii",
        "obiectiv": "Să recunoști o tautologie, o contradicție și o propoziție realizabilă.",
        "definitie": (
            "- O **tautologie** este adevărată (1) pentru **orice** valori ale variabilelor.\n"
            "- O **contradicție** este falsă (0) pentru **orice** valori ale variabilelor.\n"
            "- O propoziție **realizabilă** este adevărată pentru cel puțin o combinație de valori.\n\n"
            "Le recunoaștem cu ajutorul tabelului de adevăr: ne uităm la ultima coloană."
        ),
        "simbol": "p ∨ ¬p (tautologie), p ∧ ¬p (contradicție)",
        "scriere": "p or not p",
        "tabel": [("p or not p", "p ∨ ¬p"), ("p and not p", "p ∧ ¬p")],
        "exemplu": (
            "„Mâine plouă sau mâine nu plouă” este adevărată orice s-ar întâmpla, deci este o tautologie. "
            "„Mâine plouă și mâine nu plouă” nu poate fi niciodată adevărată, deci este o contradicție."
        ),
        "exercitiu": {
            "intrebare": "Ce este propoziția p → p?",
            "variante": ["tautologie", "contradicție", "realizabilă, dar nu tautologie"],
            "raspuns": "tautologie",
            "explicatie": "Pentru p = 1 avem 1 → 1 = 1, iar pentru p = 0 avem 0 → 0 = 1. "
                          "Este adevărată mereu, deci este o tautologie.",
        },
    },
    {
        "titlu": "Modus Ponens și Modus Tollens",
        "nivel": 2,
        "tema": "deducție",
        "obiectiv": "Să tragi concluzii corecte dintr-o implicație.",
        "definitie": (
            "Două reguli de deducție (raționament corect):\n\n"
            "- **Modus Ponens:** dacă știm că p → q și că p este adevărată, deducem că **q** este adevărată.\n"
            "- **Modus Tollens:** dacă știm că p → q și că q este falsă, deducem că **p** este falsă.\n\n"
            "⚠️ **Greșeală frecventă:** din p → q și q adevărată **nu** putem deduce p.\n\n"
            "Ambele reguli sunt tautologii, după cum arată tabelul."
        ),
        "simbol": "((p → q) ∧ p) → q  și  ((p → q) ∧ ¬q) → ¬p",
        "scriere": "((p -> q) and p) -> q",
        "tabel": [
            ("((p -> q) and p) -> q", "Modus Ponens"),
            ("((p -> q) and (not q)) -> (not p)", "Modus Tollens"),
        ],
        "exemplu": (
            "„Dacă plouă, strada este udă.” **Plouă** → deci strada este udă (Modus Ponens). "
            "**Strada nu este udă** → deci nu plouă (Modus Tollens). "
            "Dar dacă strada este udă, nu putem spune sigur că plouă: poate a trecut mașina de spălat străzi."
        ),
        "exercitiu": {
            "intrebare": (
                "„Dacă un număr se termină în 0, atunci se împarte la 5.” Numărul 37 nu se împarte la 5. "
                "Ce concluzie tragem?"
            ),
            "variante": [
                "37 se termină în 0 (Modus Ponens).",
                "37 nu se termină în 0 (Modus Tollens).",
                "Nu putem trage nicio concluzie.",
            ],
            "raspuns": "37 nu se termină în 0 (Modus Tollens).",
            "explicatie": "Concluzia implicației („se împarte la 5”) este falsă, deci și ipoteza este falsă: "
                          "aceasta este regula Modus Tollens.",
        },
    },
]
