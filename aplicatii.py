"""
Secțiunea „Unde se folosește?” – 6 mini-demonstrații despre logica din informatică.

Fiecare demonstrație are:
  - o funcție de CALCUL (fără interfață), care poate fi testată cu pytest;
  - o funcție arata_...() care desenează demonstrația cu Streamlit.
"""

import streamlit as st


def bec(aprins):
    """Textul becului: aprins sau stins (cu simbol, nu doar culoare)."""
    if aprins:
        return "💡 **Aprins (1)**"
    return "⚫ **Stins (0)**"


def unu_zero(valoare):
    """True -> "1", False -> "0"."""
    if valoare:
        return "1"
    return "0"


# =============== 1. Porți logice ===============

def poarta(tip, a, b):
    """Calculează ieșirea unei porți logice. Poarta NOT folosește doar intrarea A."""
    if tip == "AND":
        return a and b
    if tip == "OR":
        return a or b
    if tip == "XOR":
        return a != b
    return not a  # NOT


def arata_porti_logice():
    st.markdown(
        "Procesorul unui calculator este format din miliarde de **porți logice**: circuite mici care "
        "primesc curent (1) sau nu (0) și calculează o operație logică. "
        "Apasă întrerupătoarele și schimbă tipul porții."
    )
    tip = st.radio("Tipul porții:", ["AND", "OR", "XOR", "NOT"], horizontal=True, key="poarta_tip")
    col1, col2 = st.columns(2)
    a = col1.checkbox("Întrerupătorul A", key="poarta_a")
    b = col2.checkbox("Întrerupătorul B", key="poarta_b", disabled=(tip == "NOT"))

    iesire = poarta(tip, a, b)
    if tip == "NOT":
        formula = "NOT A = ¬" + unu_zero(a) + " = " + unu_zero(iesire)
    else:
        simboluri = {"AND": "∧", "OR": "∨", "XOR": "⊕"}
        formula = ("A " + tip + " B = " + unu_zero(a) + " " + simboluri[tip] + " "
                   + unu_zero(b) + " = " + unu_zero(iesire))
    st.markdown("### Becul: " + bec(iesire))
    st.write(formula)
    st.caption("AND = conjuncția, OR = disjuncția, XOR = disjuncția exclusivă, NOT = negația.")


# =============== 2. Programare: instrucțiunea if ===============

def arata_programare_if():
    st.markdown(
        "În programare, condițiile din `if` sunt **propoziții compuse**. "
        "Un site afișează o pagină secretă doar dacă utilizatorul este logat **și** are permisiune."
    )
    col1, col2 = st.columns(2)
    logat = col1.checkbox("utilizator_logat", key="if_logat")
    permisiune = col2.checkbox("are_permisiune", key="if_permisiune")

    if logat and permisiune:
        st.success("✅ Pagina se afișează.")
    else:
        st.error("❌ Acces interzis.")

    st.markdown("**Codul Python echivalent:**")
    st.code(
        "utilizator_logat = " + str(logat) + "\n"
        "are_permisiune = " + str(permisiune) + "\n\n"
        "if utilizator_logat and are_permisiune:\n"
        "    print(\"Pagina se afișează.\")\n"
        "else:\n"
        "    print(\"Acces interzis.\")",
        language="python",
    )
    st.caption("În logică: p ∧ q = " + unu_zero(logat) + " ∧ " + unu_zero(permisiune)
               + " = " + unu_zero(logat and permisiune))


# =============== 3. Validarea datelor: parola ===============

def verifica_parola(parola):
    """Verifică cele trei reguli. Întoarce trei valori: (lungime_ok, are_majuscula, are_cifra)."""
    lungime_ok = len(parola) >= 8
    are_majuscula = False
    are_cifra = False
    for caracter in parola:
        if caracter.isupper():
            are_majuscula = True
        if caracter.isdigit():
            are_cifra = True
    return lungime_ok, are_majuscula, are_cifra


def arata_validare_parola():
    st.markdown(
        "Când îți faci un cont, site-ul verifică parola cu o **conjuncție** de reguli: "
        "parola e acceptată doar dacă **toate** regulile sunt îndeplinite."
    )
    parola = st.text_input("Scrie o parolă de probă (nu folosi o parolă adevărată!):", key="parola")
    p, q, r = verifica_parola(parola)

    reguli = [
        (p, "p: are minimum 8 caractere"),
        (q, "q: are cel puțin o literă mare"),
        (r, "r: are cel puțin o cifră"),
    ]
    for indeplinita, text in reguli:
        if indeplinita:
            st.write("✅ " + text + " → 1")
        else:
            st.write("❌ " + text + " → 0")

    rezultat = p and q and r
    st.markdown("**Expresia compusă:** p ∧ q ∧ r = " + unu_zero(p) + " ∧ " + unu_zero(q) + " ∧ "
                + unu_zero(r) + " = **" + unu_zero(rezultat) + "**")
    if rezultat:
        st.success("✅ Parola este acceptată.")
    else:
        st.error("❌ Parola este respinsă: ajunge să lipsească o singură regulă (De Morgan: ¬p ∨ ¬q ∨ ¬r).")
    st.code("parola_ok = len(parola) >= 8 and are_majuscula and are_cifra", language="python")


# =============== 4. Baze de date: SQL ===============

ELEVI = [
    {"nume": "Ana", "oras": "București", "varsta": 15},
    {"nume": "Bogdan", "oras": "Cluj", "varsta": 16},
    {"nume": "Carmen", "oras": "Iași", "varsta": 14},
    {"nume": "Dan", "oras": "București", "varsta": 17},
    {"nume": "Elena", "oras": "Timișoara", "varsta": 16},
    {"nume": "Florin", "oras": "Cluj", "varsta": 15},
    {"nume": "Gabriela", "oras": "București", "varsta": 16},
    {"nume": "Horia", "oras": "Iași", "varsta": 17},
    {"nume": "Ioana", "oras": "Timișoara", "varsta": 14},
    {"nume": "Mihai", "oras": "București", "varsta": 14},
]  # elevi fictivi


def filtreaza_elevi(elevi, oras, varsta_minima, operator):
    """Păstrează elevii pentru care  oras == ... AND/OR varsta > ...  este adevărată."""
    rezultat = []
    for elev in elevi:
        conditia1 = elev["oras"] == oras
        conditia2 = elev["varsta"] > varsta_minima
        if operator == "AND":
            potrivit = conditia1 and conditia2
        else:
            potrivit = conditia1 or conditia2
        if potrivit:
            rezultat.append(elev)
    return rezultat


def arata_sql():
    st.markdown(
        "Bazele de date (de exemplu catalogul electronic) caută informații cu limbajul **SQL**. "
        "Condiția de după `WHERE` este o propoziție compusă, cu `AND` (și), `OR` (sau), `NOT` (nu)."
    )
    orase = ["București", "Cluj", "Iași", "Timișoara"]
    col1, col2, col3 = st.columns(3)
    oras = col1.selectbox("oras =", orase, key="sql_oras")
    operator = col2.radio("Operator:", ["AND", "OR"], horizontal=True, key="sql_operator")
    varsta = col3.number_input("varsta >", min_value=13, max_value=18, value=15, key="sql_varsta")

    # Tabel cu toți elevii și valoarea fiecărei condiții
    randuri = []
    for elev in ELEVI:
        conditia1 = elev["oras"] == oras
        conditia2 = elev["varsta"] > varsta
        if operator == "AND":
            potrivit = conditia1 and conditia2
        else:
            potrivit = conditia1 or conditia2
        if potrivit:
            semn = "✅ da"
        else:
            semn = "❌ nu"
        randuri.append({
            "Nume": elev["nume"], "Oraș": elev["oras"], "Vârstă": elev["varsta"],
            "p: oraș": unu_zero(conditia1), "q: vârstă": unu_zero(conditia2), "Apare?": semn,
        })
    st.markdown("**Toți elevii** (p: oras = '" + oras + "', q: varsta > " + str(varsta) + "):")
    st.dataframe(randuri, hide_index=True)

    gasiti = filtreaza_elevi(ELEVI, oras, varsta, operator)
    nume = []
    for elev in gasiti:
        nume.append(elev["nume"])
    if len(nume) == 0:
        st.warning("Rezultat: niciun elev.")
    else:
        st.success("Rezultat (" + str(len(nume)) + "): " + ", ".join(nume))

    st.markdown("**Interogarea SQL echivalentă** (doar ca text):")
    st.code("SELECT * FROM elevi\nWHERE oras = '" + oras + "' " + operator + " varsta > " + str(varsta) + ";",
            language="sql")
    st.markdown("**În Python:**")
    st.code('oras == "' + oras + '" ' + operator.lower() + " varsta > " + str(varsta), language="python")


# =============== 5. Criptografie: XOR ===============

def in_binar(numar):
    """Scrie un număr în binar, pe 8 biți: 65 -> "01000001"."""
    return format(numar, "08b")


def xor_text(coduri, cheie):
    """Aplică XOR între fiecare cod și codul cheii. Același pas criptează ȘI decriptează."""
    rezultat = []
    for cod in coduri:
        rezultat.append(cod ^ ord(cheie))  # ^ este XOR pe biți în Python
    return rezultat


def coduri_text(text):
    """Codurile literelor dintr-un text: "AB" -> [65, 66]."""
    coduri = []
    for litera in text:
        coduri.append(ord(litera))
    return coduri


def text_din_coduri(coduri):
    """Operația inversă: [65, 66] -> "AB"."""
    text = ""
    for cod in coduri:
        text = text + chr(cod)
    return text


def arata_xor():
    st.markdown(
        "Calculatorul păstrează fiecare literă ca un număr scris în **binar** (0 și 1). "
        "Dacă aplicăm **XOR bit cu bit** între literă și o cheie secretă, obținem un text criptat. "
        "Aplicând încă o dată XOR cu aceeași cheie, obținem textul inițial, pentru că (x ⊕ k) ⊕ k = x."
    )
    col1, col2 = st.columns(2)
    cuvant = col1.text_input("Cuvântul (max. 10 litere):", value="LOGICA", max_chars=10, key="xor_cuvant")
    cheie = col2.text_input("Cheia (o literă):", value="K", max_chars=1, key="xor_cheie")

    if cuvant == "" or cheie == "":
        st.info("Scrie un cuvânt și o cheie.")
        return
    # Folosim doar caractere simple (ASCII), ca fiecare să încapă în 8 biți.
    if not (cuvant + cheie).isascii():
        st.warning("⚠️ Folosește litere fără diacritice: demonstrația lucrează cu codul ASCII, "
                   "în care nu există ă, â, î, ș, ț.")
        return

    coduri = coduri_text(cuvant)
    criptat = xor_text(coduri, cheie)
    decriptat = text_din_coduri(xor_text(criptat, cheie))

    prima = cuvant[0]
    st.markdown("**Prima literă, bit cu bit:**")
    st.code(
        "  " + in_binar(ord(prima)) + "   (litera " + prima + ", cod " + str(ord(prima)) + ")\n"
        "⊕ " + in_binar(ord(cheie)) + "   (cheia " + cheie + ", cod " + str(ord(cheie)) + ")\n"
        "= " + in_binar(criptat[0]) + "   (cod " + str(criptat[0]) + ")",
        language=None,
    )
    st.caption("Regula XOR pe fiecare bit: 1 dacă biții sunt diferiți, 0 dacă sunt la fel.")

    randuri = []
    for i in range(len(cuvant)):
        randuri.append({
            "Literă": cuvant[i],
            "Binar": in_binar(coduri[i]),
            "Cheie": in_binar(ord(cheie)),
            "Criptat (binar)": in_binar(criptat[i]),
        })
    st.table(randuri, hide_index=True)

    numere = []
    for cod in criptat:
        numere.append(str(cod))
    st.markdown("**Textul criptat** (ca numere): `" + " ".join(numere) + "`")
    st.markdown("**Decriptat** (încă un XOR cu cheia „" + cheie + "”): **" + decriptat + "**")
    if decriptat == cuvant:
        st.success("✅ Am obținut din nou textul inițial.")
    st.caption("Atenție: o cheie de o singură literă este ușor de ghicit. Criptarea reală folosește chei lungi.")


# =============== 6. Sistem expert și argumentare ===============

# Fiecare regulă: „Dacă <condiția 1> ȘI <condiția 2>, atunci <concluzia>”.
# Un fapt are: întrebarea, textul când e adevărat și textul când e fals.
# La condiții reținem și valoarea cerută (True sau False).
REGULI = [
    {
        "nume": "Ploaia",
        "conditii": [
            ({"intrebare": "Plouă?", "da": "plouă", "nu": "nu plouă"}, True),
            ({"intrebare": "Am umbrelă?", "da": "am umbrelă", "nu": "nu am umbrelă"}, False),
        ],
        "concluzie": {"intrebare": "M-am udat?", "da": "mă ud", "nu": "nu mă ud"},
    },
    {
        "nume": "Răceala",
        "conditii": [
            ({"intrebare": "Are febră?", "da": "are febră", "nu": "nu are febră"}, True),
            ({"intrebare": "Tușește?", "da": "tușește", "nu": "nu tușește"}, True),
        ],
        "concluzie": {"intrebare": "Este răcit?", "da": "este răcit", "nu": "nu este răcit"},
    },
    {
        "nume": "Filmul",
        "conditii": [
            ({"intrebare": "Mi-am terminat temele?", "da": "mi-am terminat temele",
              "nu": "nu mi-am terminat temele"}, True),
            ({"intrebare": "Este weekend?", "da": "este weekend", "nu": "nu este weekend"}, True),
        ],
        "concluzie": {"intrebare": "Merg la film?", "da": "merg la film", "nu": "nu merg la film"},
    },
]


def text_regula(regula):
    """Scrie regula în cuvinte: „Dacă plouă ȘI nu am umbrelă, atunci mă ud.”"""
    parti = []
    for fapt, valoare_ceruta in regula["conditii"]:
        if valoare_ceruta:
            parti.append(fapt["da"])
        else:
            parti.append(fapt["nu"])
    return "Dacă " + " ȘI ".join(parti) + ", atunci " + regula["concluzie"]["da"] + "."


def deduce(regula, valori_conditii, valoare_concluzie):
    """Motorul de deducție al sistemului expert.

    valori_conditii: câte o valoare pentru fiecare condiție: True, False sau None (nu știm).
    valoare_concluzie: True, False sau None.
    Întoarce (concluzie, numele regulii de raționament, explicație).
    """
    # Pentru fiecare condiție aflăm dacă este îndeplinită (True), neîndeplinită (False) sau necunoscută (None).
    indeplinite = []
    for i in range(len(regula["conditii"])):
        valoare_ceruta = regula["conditii"][i][1]
        if valori_conditii[i] is None:
            indeplinite.append(None)
        else:
            indeplinite.append(valori_conditii[i] == valoare_ceruta)

    concluzie = regula["concluzie"]
    toate_adevarate = None not in indeplinite and False not in indeplinite

    if toate_adevarate and valoare_concluzie is False:
        return ("⚠️ Faptele contrazic regula!", "Contradicție",
                "Ipoteza este adevărată, dar concluzia este falsă. O implicație adevărată nu permite asta.")

    if toate_adevarate:
        return ("Deci: " + concluzie["da"] + ".", "Modus Ponens",
                "Știm p → q și p este adevărată, deci q este adevărată.")

    if valoare_concluzie is False:
        # Modus Tollens: concluzia e falsă, deci ipoteza (condiția compusă) e falsă.
        necunoscute = []
        for i in range(len(indeplinite)):
            if indeplinite[i] is None:
                necunoscute.append(i)
        if False in indeplinite:
            return ("Nu aflăm nimic nou.", "Modus Tollens",
                    "Concluzia este falsă, deci ipoteza e falsă. Știam deja că o condiție nu e îndeplinită.")
        if len(necunoscute) == 1:
            # Toate celelalte condiții sunt îndeplinite, deci cea necunoscută NU poate fi îndeplinită.
            fapt, valoare_ceruta = regula["conditii"][necunoscute[0]]
            if valoare_ceruta:
                text = fapt["nu"]
            else:
                text = fapt["da"]
            return ("Deci: " + text + ".", "Modus Tollens",
                    "Știm p → q și q este falsă, deci p este falsă. Cum celelalte condiții sunt adevărate, "
                    "doar aceasta poate fi cea falsă.")
        parti = []
        for fapt, valoare_ceruta in regula["conditii"]:
            if valoare_ceruta:
                parti.append(fapt["nu"])
            else:
                parti.append(fapt["da"])
        return ("Deci: " + " SAU ".join(parti) + ".", "Modus Tollens + De Morgan",
                "Concluzia e falsă, deci ipoteza „A ȘI B” e falsă. După De Morgan, ¬(A ∧ B) = ¬A ∨ ¬B.")

    if False in indeplinite:
        return ("Nu putem deduce nimic despre concluzie.", "Ipoteza este falsă",
                "O condiție nu este îndeplinită, deci regula nu se aplică. "
                "Când p este falsă, p → q este adevărată oricare ar fi q.")

    if valoare_concluzie is True:
        return ("Nu putem deduce că ipoteza este adevărată.", "Greșeală de evitat",
                "Din p → q și q adevărată NU rezultă p. Concluzia poate fi adevărată și din alt motiv.")

    return ("Nu am destule informații.", "—",
            "Alege mai multe fapte ca sistemul să poată aplica regula.")


def arata_sistem_expert():
    st.markdown(
        "Un **sistem expert** este un program care ia decizii folosind **reguli** de tipul "
        "„Dacă p și q, atunci r” și **fapte** cunoscute. Programul deduce concluzii la fel ca un om "
        "care argumentează corect."
    )
    nume_reguli = []
    for regula in REGULI:
        nume_reguli.append(regula["nume"])
    ales = st.selectbox("Alege regula:", nume_reguli, key="expert_regula")
    regula = REGULI[nume_reguli.index(ales)]
    st.info("📜 **Regula:** " + text_regula(regula))

    st.markdown("**Ce știi?**")
    optiuni = ["Da", "Nu", "Nu știu"]
    valori_text = {"Da": True, "Nu": False, "Nu știu": None}

    valori_conditii = []
    for i in range(len(regula["conditii"])):
        fapt = regula["conditii"][i][0]
        raspuns = st.radio(fapt["intrebare"], optiuni, index=2, horizontal=True, key="expert_" + ales + str(i))
        valori_conditii.append(valori_text[raspuns])
    raspuns = st.radio(regula["concluzie"]["intrebare"], optiuni, index=2, horizontal=True,
                       key="expert_" + ales + "_concluzie")
    valoare_concluzie = valori_text[raspuns]

    concluzie, nume_rationament, explicatie = deduce(regula, valori_conditii, valoare_concluzie)
    st.markdown("### 🤖 " + concluzie)
    st.markdown("**Regula folosită:** " + nume_rationament)
    st.caption(explicatie)


# =============== Pagina întreagă ===============

def arata_aplicatii():
    st.title("💡 Unde se folosește?")
    st.write("Logica propozițiilor compuse nu este doar la ora de matematică. Iată 6 locuri unde o folosește informatica:")
    taburi = st.tabs(["🔌 Porți logice", "🐍 if în Python", "🔑 Parole", "🗃️ SQL", "🔐 XOR", "🤖 Sistem expert"])
    with taburi[0]:
        arata_porti_logice()
    with taburi[1]:
        arata_programare_if()
    with taburi[2]:
        arata_validare_parola()
    with taburi[3]:
        arata_sql()
    with taburi[4]:
        arata_xor()
    with taburi[5]:
        arata_sistem_expert()
