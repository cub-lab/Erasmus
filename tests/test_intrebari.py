"""Verifică banca de întrebări (intrebari.json) și funcțiile din evaluare.py.

Dacă un profesor adaugă o întrebare greșit scrisă, aceste teste îl anunță.
"""

from evaluare import (incarca_intrebari, intrebari_de_nivel, alege_intrebari, numara_corecte,
                      procent, nivel_dupa_incadrare, nivel2_deblocat, statistici_pe_teme,
                      mesaje_feedback, TEME_TEXT)
from logica import tabel_adevar, clasifica

INTREBARI = incarca_intrebari()


def cauta(id_intrebare):
    for intrebare in INTREBARI:
        if intrebare["id"] == id_intrebare:
            return intrebare
    raise KeyError(id_intrebare)


def valoare(expresie):
    """Valoarea unei expresii fără variabile, ca text: "1" sau "0"."""
    return str(tabel_adevar(expresie)[0]["rezultat"])


def echivalente(a, b):
    """True dacă expresiile a și b au același tabel de adevăr."""
    return clasifica("(" + a + ") <-> (" + b + ")") == "tautologie"


# ---------- Structura băncii de întrebări ----------

def test_numar_de_intrebari_pe_niveluri():
    assert len(intrebari_de_nivel(INTREBARI, 0)) == 6
    assert len(intrebari_de_nivel(INTREBARI, 1)) >= 20
    assert len(intrebari_de_nivel(INTREBARI, 2)) >= 20


def test_id_urile_sunt_unice():
    id_uri = []
    for intrebare in INTREBARI:
        id_uri.append(intrebare["id"])
    assert len(id_uri) == len(set(id_uri))


def test_fiecare_intrebare_e_corect_scrisa():
    campuri = ["id", "nivel", "tema", "tip", "enunt", "variante", "raspuns_corect", "explicatie"]
    for intrebare in INTREBARI:
        for camp in campuri:
            assert camp in intrebare, "Întrebarea " + str(intrebare.get("id")) + " nu are " + camp
        assert intrebare["nivel"] in [0, 1, 2]
        assert intrebare["tema"] in TEME_TEXT, intrebare["id"]
        assert intrebare["tip"] in ["grila", "adevarat_fals"], intrebare["id"]
        assert intrebare["raspuns_corect"] in intrebare["variante"], intrebare["id"]
        assert len(intrebare["variante"]) == len(set(intrebare["variante"])), intrebare["id"]
        if intrebare["tip"] == "adevarat_fals":
            assert intrebare["variante"] == ["Adevărat", "Fals"], intrebare["id"]


# ---------- Răspunsurile corecte, recalculate cu motorul logic ----------

def test_raspunsuri_1_0():
    # id: expresia care dă răspunsul corect
    expresii = {
        1: "not 1", 5: "1 xor 1",
        101: "not 1", 102: "not (not 0)", 104: "1 and 0", 107: "0 or 0",
        110: "0 -> 1", 113: "1 -> 0", 114: "0 <-> 0", 117: "1 xor 0", 123: "not 1",
    }
    for id_intrebare in expresii:
        assert cauta(id_intrebare)["raspuns_corect"] == valoare(expresii[id_intrebare]), id_intrebare


def test_raspunsuri_adevarat_fals():
    # id: (expresia, textul pentru 1, textul pentru 0)
    cazuri = {
        2: ("1 and 0", "adevărată", "falsă"),
        3: ("0 or 1", "Adevărat", "Fals"),
        105: ("1 and 1", "Adevărat", "Fals"),
        108: ("1 or 0", "Adevărat", "Fals"),
        111: ("0 -> 0", "Adevărat", "Fals"),
        116: ("1 <-> 1", "adevărată", "falsă"),
        121: ("0 or 1", "aprins (1)", "stins (0)"),
        223: ("(1 and 0) or (not 0)", "aprins (1)", "stins (0)"),
    }
    for id_intrebare in cazuri:
        expresie, text_1, text_0 = cazuri[id_intrebare]
        if valoare(expresie) == "1":
            asteptat = text_1
        else:
            asteptat = text_0
        assert cauta(id_intrebare)["raspuns_corect"] == asteptat, id_intrebare


def test_clasificari():
    clasificari = {
        205: "p and not p",
        206: "p -> (p or q)",
        207: "p and q",
        209: "(p -> q) <-> ((not q) -> (not p))",
    }
    for id_intrebare in clasificari:
        tip = clasifica(clasificari[id_intrebare])
        if tip == "realizabilă":
            tip = "realizabilă, dar nu tautologie"
        assert cauta(id_intrebare)["raspuns_corect"] == tip, id_intrebare


def test_expresii_echivalente():
    # id: (expresia din enunț, {variantă: expresia ei în LogicLab})
    cazuri = {
        6: ("not (p and q)", {"¬p ∧ ¬q": "(not p) and (not q)", "¬p ∨ ¬q": "(not p) or (not q)",
                              "p ∨ q": "p or q", "¬p ∧ q": "(not p) and q"}),
        201: ("not (p or q)", {"¬p ∨ ¬q": "(not p) or (not q)", "¬p ∧ ¬q": "(not p) and (not q)",
                               "p ∧ q": "p and q", "¬p ∨ q": "(not p) or q"}),
        214: ("p -> q", {"¬p ∨ q": "(not p) or q", "p ∨ ¬q": "p or (not q)",
                         "¬p ∧ q": "(not p) and q", "q → p": "q -> p"}),
        215: ("not (p -> q)", {"¬p → ¬q": "(not p) -> (not q)", "p ∧ ¬q": "p and (not q)",
                               "¬p ∧ q": "(not p) and q", "q → p": "q -> p"}),
        216: ("p xor q", {"¬(p ↔ q)": "not (p <-> q)", "p ↔ q": "p <-> q",
                          "p ∧ q": "p and q", "¬p ∨ q": "(not p) or q"}),
    }
    for id_intrebare in cazuri:
        tinta, variante = cazuri[id_intrebare]
        intrebare = cauta(id_intrebare)
        for varianta in intrebare["variante"]:
            e_corecta = varianta == intrebare["raspuns_corect"]
            # Varianta corectă trebuie să fie echivalentă cu ținta, celelalte nu.
            assert echivalente(tinta, variante[varianta]) == e_corecta, (id_intrebare, varianta)


def test_legea_de_morgan_din_intrebarea_203():
    assert clasifica("(not (p and q)) <-> ((not p) or (not q))") == "tautologie"
    assert cauta(203)["raspuns_corect"] == "Adevărat"


def test_aplicatii_calculate_in_python():
    # 120: if varsta >= 18 and are_bilet
    varsta = 20
    are_bilet = False
    assert cauta(120)["raspuns_corect"] == ("Da" if varsta >= 18 and are_bilet else "Nu")

    # 122: parola „soare123”
    parola = "soare123"
    are_cifra = False
    for caracter in parola:
        if caracter.isdigit():
            are_cifra = True
    acceptata = len(parola) >= 8 and are_cifra
    assert cauta(122)["raspuns_corect"] == ("Adevărat" if acceptata else "Fals")

    # 217: 1011 XOR 0110
    assert cauta(217)["raspuns_corect"] == format(0b1011 ^ 0b0110, "04b")

    # 219: SQL cu OR
    elevi = [("Ana", "Iași", 15), ("Radu", "Cluj", 17), ("Mihai", "Iași", 17), ("Ioana", "Cluj", 14)]
    gasiti = 0
    for nume, oras, varsta in elevi:
        if oras == "Iași" or varsta > 16:
            gasiti = gasiti + 1
    assert cauta(219)["raspuns_corect"] == str(gasiti)

    # 221: not a or b
    a = True
    b = False
    assert cauta(221)["raspuns_corect"] == ("X" if (not a or b) else "Y")


# ---------- Funcțiile din evaluare.py ----------

def test_alege_10_intrebari_diferite():
    alese = alege_intrebari(INTREBARI, 1, [])
    assert len(alese) == 10
    id_uri = [intrebare["id"] for intrebare in alese]
    assert len(set(id_uri)) == 10
    for intrebare in alese:
        assert intrebare["nivel"] == 1


def test_reia_testul_alege_alte_intrebari():
    primul = alege_intrebari(INTREBARI, 2, [])
    folosite = [intrebare["id"] for intrebare in primul]
    al_doilea = alege_intrebari(INTREBARI, 2, folosite)
    # Avem minimum 20 de întrebări, deci al doilea test poate fi complet nou.
    for intrebare in al_doilea:
        assert intrebare["id"] not in folosite


def test_scor_si_incadrare():
    intrebari = intrebari_de_nivel(INTREBARI, 0)
    raspunsuri = [intrebare["raspuns_corect"] for intrebare in intrebari]
    raspunsuri[0] = "altceva"
    assert numara_corecte(intrebari, raspunsuri) == 5
    assert procent(5, 6) == 83
    assert nivel_dupa_incadrare(procent(3, 6)) == 1   # 50%
    assert nivel_dupa_incadrare(60) == 2
    assert nivel_dupa_incadrare(procent(4, 6)) == 2   # 67%


def test_deblocare_nivel_2():
    assert nivel2_deblocat(2, None) is True
    assert nivel2_deblocat(1, None) is False
    assert nivel2_deblocat(1, 60) is False
    assert nivel2_deblocat(1, 70) is True
    assert nivel2_deblocat(None, 80) is True


def test_feedback_pe_teme():
    intrebari = [
        {"tema": "implicația", "raspuns_corect": "1"},
        {"tema": "implicația", "raspuns_corect": "1"},
        {"tema": "implicația", "raspuns_corect": "1"},
        {"tema": "implicația", "raspuns_corect": "1"},
        {"tema": "negația", "raspuns_corect": "0"},
        {"tema": "aplicații", "raspuns_corect": "0"},
    ]
    raspunsuri = ["0", "0", "0", "1", "0", "1"]
    statistici = statistici_pe_teme(intrebari, raspunsuri)
    assert statistici["implicația"] == {"total": 4, "gresite": 3}
    mesaje = mesaje_feedback(statistici)
    assert mesaje == [
        ("implicația", "Ai greșit 3 din 4 întrebări despre implicație. Recitește lecția «Implicația»."),
        ("aplicații", "Ai greșit 1 din 1 întrebare despre aplicații în informatică. "
                      "Revezi secțiunea «Unde se folosește?»."),
    ]
