"""
LogicLab – interfața aplicației (Streamlit).

Pornire:  streamlit run app.py
Fiecare secțiune din bara laterală are propria funcție: arata_acasa(), arata_... etc.
"""

import os

import streamlit as st

import aplicatii
import evaluare
import logica
from lectii import LECTII

# Autorul resursei (apare în subsol). Înlocuiește cu numele tău și al liceului.
AUTOR = "NUME_ELEV"
LICEU = "LICEUL_MILITAR"

FISA_RED = os.path.join(os.path.dirname(__file__), "fisa_RED.md")

# Numele secțiunilor din bara laterală, în ordinea în care apar.
SECTIUNI = [
    "Acasă",
    "Test de încadrare",
    "Lecții",
    "Generator de tabele de adevăr",
    "Unde se folosește?",
    "Teste pe niveluri",
    "Despre această resursă",
]

# Emoji-ul afișat în meniu în fața fiecărei secțiuni.
ICONITE = {
    "Acasă": "🏠",
    "Test de încadrare": "🧭",
    "Lecții": "📖",
    "Generator de tabele de adevăr": "🧮",
    "Unde se folosește?": "💡",
    "Teste pe niveluri": "📝",
    "Despre această resursă": "ℹ️",
}

NUME_NIVELURI = {
    1: "Nivel 1 – Începător",
    2: "Nivel 2 – Avansat",
}


def pregateste_sesiunea():
    """Pune valorile de pornire în st.session_state (doar la prima rulare)."""
    if "sectiune" not in st.session_state:
        st.session_state["sectiune"] = SECTIUNI[0]
    if "nivel" not in st.session_state:
        st.session_state["nivel"] = None  # încă nu a dat testul de încadrare
    if "raspunsuri_incadrare" not in st.session_state:
        st.session_state["raspunsuri_incadrare"] = None  # testul de încadrare nu e dat încă
    if "scor_nivel1" not in st.session_state:
        st.session_state["scor_nivel1"] = None  # cel mai bun procent la testul de Nivel 1
    if "test" not in st.session_state:
        st.session_state["test"] = None  # testul pe niveluri aflat în desfășurare
    if "intrebari_vazute" not in st.session_state:
        # id-urile întrebărilor pe care elevul le-a primit deja, pe fiecare nivel
        st.session_state["intrebari_vazute"] = {0: [], 1: [], 2: []}
    if "intrebari_incadrare" not in st.session_state:
        st.session_state["intrebari_incadrare"] = None  # cele 6 întrebări alese pentru încadrare
    if "runda" not in st.session_state:
        st.session_state["runda"] = 0  # crește la fiecare test nou (pentru chei unice)


def mergi_la(sectiune):
    """Schimbă secțiunea afișată (folosită de butoane)."""
    st.session_state["sectiune"] = sectiune


def titlu_lectie(lectie):
    """Titlul afișat în lista de lecții, de ex. „Legile lui De Morgan (Nivel 2)”."""
    if lectie["nivel"] == 2:
        return lectie["titlu"] + " (Nivel 2)"
    return lectie["titlu"]


def mergi_la_tema(tema):
    """Deschide lecția potrivită pentru o temă (sau secțiunea de aplicații)."""
    for lectie in LECTII:
        if lectie["tema"] == tema:
            st.session_state["lectie_aleasa"] = titlu_lectie(lectie)
            st.session_state["sectiune"] = "Lecții"
            return
    st.session_state["sectiune"] = "Unde se folosește?"


def eticheta_meniu(sectiune):
    """Textul afișat în meniu: emoji-ul + numele, de ex. „🏠 Acasă”."""
    return ICONITE[sectiune] + " " + sectiune


def arata_bara_laterala():
    """Bara laterală: titlul, meniul de navigare și nivelul elevului."""
    st.sidebar.title("🧠 LogicLab")
    # key="sectiune" leagă meniul de st.session_state["sectiune"].
    # format_func schimbă doar ce se AFIȘEAZĂ; în sesiune rămâne numele simplu.
    st.sidebar.radio("Alege o secțiune:", SECTIUNI, key="sectiune", format_func=eticheta_meniu)

    st.sidebar.divider()
    nivel = st.session_state["nivel"]
    if nivel is None:
        st.sidebar.info("Nivelul tău: încă nestabilit.\n\nDă testul de încadrare!")
    else:
        st.sidebar.success("Nivelul tău: **" + NUME_NIVELURI[nivel] + "**")
    if st.session_state["scor_nivel1"] is not None:
        st.sidebar.write("Cel mai bun scor la Nivel 1: **" + str(st.session_state["scor_nivel1"]) + "%**")


def arata_subsol():
    """Subsolul cu licența, afișat pe fiecare pagină."""
    st.divider()
    st.caption(
        "LogicLab – Resursă Educațională Deschisă, realizată de " + AUTOR + ", " + LICEU + ". "
        "Conținut educațional: licența CC BY-SA 4.0. Cod: licența MIT. "
        "Fără cont, fără plată, fără date personale colectate."
    )


def arata_acasa():
    st.title("🧠 LogicLab")
    st.subheader("Învață propozițiile compuse în ritmul tău")
    st.write(
        "LogicLab te ajută să înțelegi **propozițiile compuse** din logica matematică "
        "și să vezi unde se folosesc în informatică: în programare, baze de date, "
        "criptografie sau în circuitele unui calculator."
    )

    st.markdown("### 📋 Obiective de învățare")
    st.markdown(
        "La finalul acestei resurse vei putea:\n"
        "1. să deosebești o propoziție simplă de una compusă și să îi stabilești valoarea de adevăr (1/0);\n"
        "2. să folosești operatorii logici: negația, conjuncția, disjuncția, implicația, echivalența și XOR;\n"
        "3. să construiești și să interpretezi tabelul de adevăr al unei expresii;\n"
        "4. să recunoști tautologiile și contradicțiile și să aplici legile lui De Morgan;\n"
        "5. să aplici logica în exemple din informatică: condiții `if`, parole, SQL, porți logice."
    )

    st.markdown("### 🚀 Cum funcționează")
    st.markdown(
        "- Începi cu un **test de încadrare** scurt (6 întrebări).\n"
        "- În funcție de rezultat, ești încadrat la **Nivel 1 – Începător** sau **Nivel 2 – Avansat**.\n"
        "- Parcurgi **lecțiile**, exersezi cu **generatorul de tabele de adevăr** și dai **testele pe niveluri**.\n"
        "- La final primești **feedback personalizat**: ce teme să recitești."
    )

    nivel = st.session_state["nivel"]
    if nivel is None:
        st.button(
            "Începe testul de încadrare",
            type="primary",
            on_click=mergi_la,
            args=["Test de încadrare"],
        )
    else:
        # Elevul are deja un nivel: îi propunem direct testul potrivit.
        st.success("Nivelul tău: **" + NUME_NIVELURI[nivel] + "**")
        st.button(
            "📝 Continuă cu testul de Nivel " + str(nivel),
            type="primary",
            on_click=incepe_test_si_mergi,
            args=[nivel],
        )

    st.markdown("### 📜 Licență")
    st.write(
        "Textele și întrebările sunt sub licența **CC BY-SA 4.0**, iar codul este sub licența **MIT**. "
        "Poți folosi, modifica și distribui liber această resursă, cu menționarea autorului."
    )


def arata_generator():
    st.title("🧮 Generator de tabele de adevăr")
    st.write(
        "Scrie o expresie cu variabilele **p**, **q**, **r** și primești tabelul ei de adevăr. "
        "Poți folosi: `and`, `or`, `not`, `->` (implicația), `<->` (echivalența), `xor`, "
        "paranteze și valorile `1` și `0`."
    )
    st.info(
        "📌 **Regula parantezelor:** în jurul lui `->`, `<->` și `xor` pune paranteze la părțile compuse. "
        "Scrie `(p and q) -> r`, nu `p and q -> r`. "
        "Așa nu există nicio îndoială despre ce se calculează mai întâi."
    )

    expresie = st.text_input("Expresia ta:", value="(p and q) -> r")
    if expresie.strip() == "":
        return

    corecta, mesaj = logica.valideaza(expresie)
    if not corecta:
        st.error("❌ " + mesaj)
        return

    tabel = logica.tabel_adevar(expresie)
    # Redenumim coloana „rezultat” cu expresia însăși, ca în manual.
    randuri = []
    for rand in tabel:
        rand_nou = {}
        for cheie in rand:
            if cheie == "rezultat":
                rand_nou[expresie] = rand[cheie]
            else:
                rand_nou[cheie] = rand[cheie]
        randuri.append(rand_nou)
    st.table(randuri, hide_index=True)  # fără coloana de numerotare 0, 1, 2...
    numar_variabile = len(logica.variabile_folosite(expresie))
    st.caption("Numărul de rânduri: 2ⁿ = " + str(len(tabel)) + ", unde n = "
               + str(numar_variabile) + " este numărul de variabile.")

    tip = logica.clasifica(expresie)
    if tip == "tautologie":
        st.success("✅ Expresia este o **tautologie**: este adevărată (1) pe toate rândurile.")
    elif tip == "contradicție":
        st.warning("⛔ Expresia este o **contradicție**: este falsă (0) pe toate rândurile.")
    else:
        st.info("🔹 Expresia este **realizabilă**: este adevărată pe cel puțin un rând, dar nu pe toate.")

    with st.expander("Vezi cum o înțelege Python"):
        st.code(logica.traduce(expresie), language="python")
        st.caption("Pentru valori 1/0: `->` devine `<=`, `<->` devine `==`, iar `xor` devine `!=`.")


def construieste_tabel(perechi):
    """Face un singur tabel de adevăr pentru mai multe expresii (cu aceleași variabile).

    perechi: listă de (expresie LogicLab, etichetă afișată), de ex. [("p and q", "p ∧ q")]
    """
    tabele = []
    for expresie, eticheta in perechi:
        tabele.append(logica.tabel_adevar(expresie))

    randuri = []
    numar_randuri = len(tabele[0])
    for i in range(numar_randuri):
        # Coloanele cu variabile le luăm din primul tabel...
        rand = {}
        for cheie in tabele[0][i]:
            if cheie != "rezultat":
                rand[cheie] = tabele[0][i][cheie]
        # ...apoi adăugăm câte o coloană pentru fiecare expresie.
        for j in range(len(perechi)):
            eticheta = perechi[j][1]
            rand[eticheta] = tabele[j][i]["rezultat"]
        randuri.append(rand)
    return randuri


def arata_lectii():
    st.title("📖 Lecții")

    titluri = []
    for lectie in LECTII:
        titluri.append(titlu_lectie(lectie))
    ales = st.selectbox("Alege lecția:", titluri, key="lectie_aleasa")
    numar = titluri.index(ales)
    lectie = LECTII[numar]

    st.header(lectie["titlu"])
    st.markdown("**📋 Obiectiv:** " + lectie["obiectiv"])

    st.markdown("#### 📘 Definiție")
    st.markdown(lectie["definitie"])
    st.markdown("**Simbol:** " + lectie["simbol"] + " &nbsp;·&nbsp; **În LogicLab scrii:** `" + lectie["scriere"] + "`")
    # Câmpuri opționale: nu toate lecțiile le au.
    if "alte_notatii" in lectie:
        st.markdown("**Alte notații** (la Logică): " + lectie["alte_notatii"])
    if "cuvinte" in lectie:
        st.markdown("**Cuvinte care îl exprimă:** " + lectie["cuvinte"])

    if len(lectie["tabel"]) > 0:
        st.markdown("#### 🧮 Tabelul de adevăr")
        st.table(construieste_tabel(lectie["tabel"]), hide_index=True)

    st.markdown("#### 🌍 Exemplu din viața reală")
    st.markdown(lectie["exemplu"])

    st.markdown("#### ✏️ Exercițiu")
    exercitiu = lectie["exercitiu"]
    # index=None înseamnă că la început nu e bifată nicio variantă.
    raspuns = st.radio(exercitiu["intrebare"], exercitiu["variante"], index=None, key="exercitiu_" + str(numar))
    if raspuns is not None:
        if raspuns == exercitiu["raspuns"]:
            st.success("✅ Corect! " + exercitiu["explicatie"])
        else:
            st.error("❌ Nu este corect. " + exercitiu["explicatie"])


# ---------------- Testul de încadrare ----------------

def alege_si_retine(nivel, numar):
    """Alege întrebări noi pentru elev și ține minte că le-a văzut."""
    toate = evaluare.incarca_intrebari()
    vazute = st.session_state["intrebari_vazute"][nivel]
    # Dacă elevul a văzut aproape toate întrebările nivelului, o luăm de la capăt.
    if len(evaluare.intrebari_de_nivel(toate, nivel)) - len(vazute) < numar:
        vazute = []
    alese = evaluare.alege_intrebari(toate, nivel, vazute, numar)
    for intrebare in alese:
        vazute.append(intrebare["id"])
    st.session_state["intrebari_vazute"][nivel] = vazute
    st.session_state["runda"] = st.session_state["runda"] + 1  # chei noi pentru butoanele radio
    return alese


def arata_test_incadrare():
    st.title("🧭 Test de încadrare")
    # La prima deschidere (și după „Reia încadrarea”) alegem aleator 6 întrebări, câte una pe temă.
    if st.session_state["intrebari_incadrare"] is None:
        st.session_state["intrebari_incadrare"] = alege_si_retine(0, evaluare.NUMAR_INTREBARI_INCADRARE)
        st.session_state["runda_incadrare"] = st.session_state["runda"]
    intrebari = st.session_state["intrebari_incadrare"]

    if st.session_state["raspunsuri_incadrare"] is not None:
        arata_rezultat_incadrare(intrebari)
        return

    st.write(
        "Răspunde la " + str(len(intrebari)) + " întrebări scurte. Nu e o notă: testul ne ajută "
        "să aflăm de unde să începi. Cu un scor de **minimum 60%** ești încadrat la "
        "**Nivel 2 – Avansat**, altfel începi cu **Nivel 1 – Începător**."
    )

    # Un formular trimite toate răspunsurile odată, la apăsarea butonului.
    with st.form("formular_incadrare"):
        for i in range(len(intrebari)):
            intrebare = intrebari[i]
            st.markdown("**" + str(i + 1) + ".** " + intrebare["enunt"])
            st.radio("Răspunsul tău:", intrebare["variante"], index=None,
                     key=cheie_incadrare(intrebare))
        trimis = st.form_submit_button("Vezi rezultatul", type="primary")

    if trimis:
        raspunsuri = []
        for intrebare in intrebari:
            raspunsuri.append(st.session_state[cheie_incadrare(intrebare)])
        if None in raspunsuri:
            st.warning("⚠️ Răspunde la toate întrebările înainte să vezi rezultatul.")
            return
        corecte = evaluare.numara_corecte(intrebari, raspunsuri)
        st.session_state["raspunsuri_incadrare"] = raspunsuri
        st.session_state["nivel"] = evaluare.nivel_dupa_incadrare(evaluare.procent(corecte, len(intrebari)))
        st.rerun()  # rulăm pagina din nou, ca bara laterală să arate noul nivel


def cheie_incadrare(intrebare):
    """Cheia unică a butoanelor radio pentru o întrebare din încadrare."""
    return "incadrare_" + str(st.session_state["runda_incadrare"]) + "_" + str(intrebare["id"])


def reia_incadrarea():
    st.session_state["raspunsuri_incadrare"] = None
    st.session_state["nivel"] = None
    st.session_state["intrebari_incadrare"] = None  # la reluare se aleg alte întrebări


def arata_rezultat_incadrare(intrebari):
    raspunsuri = st.session_state["raspunsuri_incadrare"]
    corecte = evaluare.numara_corecte(intrebari, raspunsuri)
    procent = evaluare.procent(corecte, len(intrebari))
    nivel = st.session_state["nivel"]

    st.metric("Scorul tău", str(corecte) + " din " + str(len(intrebari)), str(procent) + "%",
              delta_color="off")
    if nivel == 2:
        st.success("🚀 Ai fost încadrat la **" + NUME_NIVELURI[2] + "**. "
                   "Poți da direct testul de Nivel 2, dar lecțiile de bază îți stau oricând la dispoziție.")
    else:
        st.info("🌱 Ai fost încadrat la **" + NUME_NIVELURI[1] + "**. Începe cu lecțiile, apoi dă testul "
                "de Nivel 1. Cu minimum 70% la el, deblochezi Nivelul 2.")

    st.markdown("#### Răspunsurile tale")
    for i in range(len(intrebari)):
        arata_corectare(i + 1, intrebari[i], raspunsuri[i])

    st.markdown("#### Ce urmează?")
    if nivel == 2:
        eticheta = "🚀 Începe testul de Nivel 2 – Avansat"
    else:
        eticheta = "🌱 Începe testul de Nivel 1 – Începător"
    st.button(eticheta, type="primary", on_click=incepe_test_si_mergi, args=[nivel], width="stretch")

    col1, col2 = st.columns(2)
    col1.button("📖 Mergi la lecții", on_click=mergi_la, args=["Lecții"], width="stretch")
    col2.button("🔁 Reia încadrarea", on_click=reia_incadrarea, width="stretch")


def arata_corectare(numar, intrebare, raspuns):
    """Afișează o întrebare cu ✅/❌ și explicația (folosită la rezultatele testelor)."""
    if raspuns == intrebare["raspuns_corect"]:
        eticheta = "✅ " + str(numar) + ". Corect"
    else:
        eticheta = "❌ " + str(numar) + ". Greșit"
    with st.expander(eticheta):
        st.markdown(intrebare["enunt"])
        st.markdown("**Răspunsul tău:** " + raspuns)
        st.markdown("**Răspunsul corect:** " + intrebare["raspuns_corect"])
        st.markdown("💡 " + intrebare["explicatie"])


# ---------------- Testele pe niveluri ----------------

def incepe_test(nivel):
    """Pornește un test nou de 10 întrebări (apelată de butoane)."""
    alese = alege_si_retine(nivel, evaluare.NUMAR_INTREBARI_TEST)
    st.session_state["test"] = {
        "nivel": nivel,
        "intrebari": alese,
        "pozitie": 0,           # la a câta întrebare suntem (de la 0)
        "raspunsuri": [],       # răspunsurile date până acum
        "verificat": False,     # dacă răspunsul la întrebarea curentă a fost verificat
        "deblocat_acum": False, # dacă testul acesta a deblocat Nivelul 2
    }


def incepe_test_si_mergi(nivel):
    """Pornește testul și deschide secțiunea „Teste pe niveluri” (pentru butoanele din alte pagini)."""
    incepe_test(nivel)
    st.session_state["sectiune"] = "Teste pe niveluri"


def cheie_raspuns(test):
    """Cheia unică a butoanelor radio pentru întrebarea curentă."""
    return "raspuns_" + str(st.session_state["runda"]) + "_" + str(test["pozitie"])


def verifica_raspuns():
    test = st.session_state["test"]
    test["raspunsuri"].append(st.session_state[cheie_raspuns(test)])
    test["verificat"] = True


def urmatoarea_intrebare():
    test = st.session_state["test"]
    test["pozitie"] = test["pozitie"] + 1
    test["verificat"] = False
    if test["pozitie"] == len(test["intrebari"]):
        termina_test(test)


def termina_test(test):
    """La finalul testului de Nivel 1 reținem cel mai bun scor și, la nevoie, deblocăm Nivelul 2."""
    if test["nivel"] != 1:
        return
    corecte = evaluare.numara_corecte(test["intrebari"], test["raspunsuri"])
    procent = evaluare.procent(corecte, len(test["intrebari"]))
    cel_mai_bun = st.session_state["scor_nivel1"]
    if cel_mai_bun is None or procent > cel_mai_bun:
        st.session_state["scor_nivel1"] = procent
    if procent >= evaluare.PRAG_DEBLOCARE and st.session_state["nivel"] != 2:
        st.session_state["nivel"] = 2
        test["deblocat_acum"] = True


def inchide_test():
    st.session_state["test"] = None


def arata_teste():
    st.title("📝 Teste pe niveluri")
    test = st.session_state["test"]
    if test is None:
        arata_alegere_nivel()
    elif test["pozitie"] < len(test["intrebari"]):
        arata_intrebare_curenta(test)
    else:
        arata_rezultat_test(test)


def arata_alegere_nivel():
    st.write(
        "Fiecare test are **10 întrebări** alese aleator. După fiecare răspuns afli imediat dacă e corect "
        "și de ce. La final primești **feedback pe teme**: ce lecții să recitești."
    )
    deblocat = evaluare.nivel2_deblocat(st.session_state["nivel"], st.session_state["scor_nivel1"])

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("#### 🌱 Nivel 1 – Începător")
        st.write("Negația, conjuncția, disjuncția, implicația, echivalența, XOR și primele aplicații.")
        st.button("Începe testul de Nivel 1", type="primary", on_click=incepe_test, args=[1],
                  width="stretch")
    with col2:
        st.markdown("#### 🚀 Nivel 2 – Avansat")
        st.write("Legile lui De Morgan, tautologii, deducții și aplicații în informatică.")
        st.button("Începe testul de Nivel 2", type="primary", on_click=incepe_test, args=[2],
                  disabled=not deblocat, width="stretch")
        if not deblocat:
            st.caption("🔒 Se deblochează dacă ai fost încadrat la Nivel 2 "
                       "sau dacă obții minimum 70% la testul de Nivel 1.")


def arata_intrebare_curenta(test):
    pozitie = test["pozitie"]
    total = len(test["intrebari"])
    intrebare = test["intrebari"][pozitie]

    st.progress(pozitie / total,
                text="Nivel " + str(test["nivel"]) + " · Întrebarea " + str(pozitie + 1) + " din " + str(total))
    st.markdown("#### Întrebarea " + str(pozitie + 1))
    st.markdown(intrebare["enunt"])

    cheie = cheie_raspuns(test)
    # După verificare, variantele se blochează, ca răspunsul să nu mai poată fi schimbat.
    st.radio("Alege răspunsul:", intrebare["variante"], index=None, key=cheie, disabled=test["verificat"])

    if not test["verificat"]:
        nu_a_ales = st.session_state[cheie] is None
        st.button("Verifică răspunsul", type="primary", on_click=verifica_raspuns, disabled=nu_a_ales)
        arata_buton_oprire()
        return

    raspuns = test["raspunsuri"][pozitie]
    if raspuns == intrebare["raspuns_corect"]:
        st.success("✅ Corect! " + intrebare["explicatie"])
    else:
        st.error("❌ Greșit. Răspunsul corect este: **" + intrebare["raspuns_corect"] + "**. "
                 + intrebare["explicatie"])

    if pozitie + 1 < total:
        st.button("Următoarea întrebare ➡️", type="primary", on_click=urmatoarea_intrebare)
    else:
        st.button("Vezi rezultatul 🏁", type="primary", on_click=urmatoarea_intrebare)
    arata_buton_oprire()


def arata_buton_oprire():
    st.divider()
    st.button("⬅️ Oprește testul și alege alt nivel", on_click=inchide_test)


def arata_rezultat_test(test):
    intrebari = test["intrebari"]
    raspunsuri = test["raspunsuri"]
    corecte = evaluare.numara_corecte(intrebari, raspunsuri)
    procent = evaluare.procent(corecte, len(intrebari))

    st.markdown("### 🏁 Rezultatul testului de Nivel " + str(test["nivel"]))
    st.metric("Scorul tău", str(corecte) + " din " + str(len(intrebari)), str(procent) + "%",
              delta_color="off")
    if procent >= 90:
        st.success("🌟 Excelent! Stăpânești foarte bine această temă.")
    elif procent >= 70:
        st.success("👍 Foarte bine! Mai ai câteva lucruri de pus la punct.")
    elif procent >= 50:
        st.info("🙂 Ești pe drumul cel bun. Recitește lecțiile de mai jos și încearcă din nou.")
    else:
        st.warning("📚 Mai exersează puțin. Recitește lecțiile de mai jos, apoi reia testul.")

    if test["deblocat_acum"]:
        st.success("🔓 **Felicitări! Ai deblocat Nivelul 2 – Avansat.**")
    elif test["nivel"] == 1 and procent < evaluare.PRAG_DEBLOCARE and st.session_state["nivel"] != 2:
        st.info("🔒 Pentru a debloca Nivelul 2 ai nevoie de minimum "
                + str(evaluare.PRAG_DEBLOCARE) + "% la acest test.")

    # Feedback personalizat pe teme
    st.markdown("#### 📚 Ce să recitești")
    statistici = evaluare.statistici_pe_teme(intrebari, raspunsuri)
    mesaje = evaluare.mesaje_feedback(statistici)
    if len(mesaje) == 0:
        st.success("✅ Nu ai greșit nicio întrebare. Nu ai nimic de recitit!")
    for tema, mesaj in mesaje:
        st.warning("📌 " + mesaj)
        st.button("Deschide", key="deschide_" + tema, on_click=mergi_la_tema, args=[tema])

    st.markdown("#### Rezultate pe teme")
    randuri = []
    for tema in statistici:
        total = statistici[tema]["total"]
        corecte_tema = total - statistici[tema]["gresite"]
        if corecte_tema == total:
            stare = "✅"
        else:
            stare = "❌"
        randuri.append({"Tema": evaluare.TEME_TEXT[tema], "Corecte": str(corecte_tema) + " din " + str(total),
                        "": stare})
    st.table(randuri, hide_index=True)

    st.markdown("#### Toate răspunsurile")
    for i in range(len(intrebari)):
        arata_corectare(i + 1, intrebari[i], raspunsuri[i])

    col1, col2 = st.columns(2)
    col1.button("🔁 Reia testul", type="primary", on_click=incepe_test, args=[test["nivel"]],
                width="stretch")
    col2.button("⬅️ Alege alt nivel", on_click=inchide_test, width="stretch")
    st.caption("La „Reia testul” primești alte întrebări decât cele pe care le-ai văzut deja.")


def arata_despre():
    """Afișează fișa resursei, citită direct din fisa_RED.md."""
    st.title("ℹ️ Despre această resursă")
    with open(FISA_RED, encoding="utf-8") as fisier:
        st.markdown(fisier.read())


# ---------------- Programul principal ----------------

st.set_page_config(page_title="LogicLab", page_icon="🧠", layout="centered")
pregateste_sesiunea()
arata_bara_laterala()

sectiune = st.session_state["sectiune"]
if sectiune == "Acasă":
    arata_acasa()
elif sectiune == "Test de încadrare":
    arata_test_incadrare()
elif sectiune == "Teste pe niveluri":
    arata_teste()
elif sectiune == "Unde se folosește?":
    aplicatii.arata_aplicatii()
elif sectiune == "Lecții":
    arata_lectii()
elif sectiune == "Generator de tabele de adevăr":
    arata_generator()
elif sectiune == "Despre această resursă":
    arata_despre()

arata_subsol()
