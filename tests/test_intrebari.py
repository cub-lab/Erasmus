"""Verifică banca de întrebări (intrebari.json) și funcțiile din evaluare.py.

Dacă un profesor adaugă o întrebare greșit scrisă, aceste teste îl anunță.
"""

from evaluare import (incarca_intrebari, intrebari_de_nivel, alege_intrebari, amesteca_variante,
                      numara_corecte, procent, nivel_dupa_incadrare, nivel2_deblocat, statistici_pe_teme,
                      mesaje_feedback, TEME_TEXT, NUMAR_INTREBARI_INCADRARE, NUMAR_INTREBARI_TEST)
from aplicatii import deduce
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

def teme_de_nivel(nivel):
    teme = set()
    for intrebare in intrebari_de_nivel(INTREBARI, nivel):
        teme.add(intrebare["tema"])
    return teme


def test_numar_de_intrebari_pe_niveluri():
    # Banca are mult mai multe întrebări decât primește elevul, ca testele să difere între ele.
    assert len(intrebari_de_nivel(INTREBARI, 0)) >= 2 * NUMAR_INTREBARI_INCADRARE
    assert len(intrebari_de_nivel(INTREBARI, 1)) >= 3 * NUMAR_INTREBARI_TEST
    assert len(intrebari_de_nivel(INTREBARI, 2)) >= 3 * NUMAR_INTREBARI_TEST
    # La încadrare trebuie să existe câte o temă pentru fiecare întrebare.
    assert len(teme_de_nivel(0)) >= NUMAR_INTREBARI_INCADRARE


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
        7: "not 0", 9: "1 and 1", 12: "1 or 1", 13: "0 -> 0", 15: "0 xor 1",
        101: "not 1", 102: "not (not 0)", 104: "1 and 0", 107: "0 or 0",
        110: "0 -> 1", 113: "1 -> 0", 114: "0 <-> 0", 117: "1 xor 0", 123: "not 1",
        125: "not 1",  # ¬p = 1 => p = ¬1
        126: "0 and 0", 128: "1 or 0", 130: "1 -> 1", 133: "1 <-> 1", 134: "0 <-> 1", 136: "0 xor 0",
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
        8: ("not 0", "Adevărat", "Fals"),             # negația lui „7 este par” (0)
        11: ("0 or 0", "adevărată", "falsă"),
        14: ("1 -> 0", "Adevărat", "Fals"),
        127: ("1 and 1", "adevărată", "falsă"),
        138: ("1 and 0", "aprins (1)", "stins (0)"),
        240: ("not (0 or 0)", "aprins (1)", "stins (0)"),
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
        227: "p or (not p)",
        228: "(p and q) -> p",
        229: "(p -> q) and (p and (not q))",
        230: "p -> q",
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
        225: ("not ((not p) and q)", {"p ∨ ¬q": "p or (not q)", "¬p ∨ q": "(not p) or q",
                                      "p ∧ ¬q": "p and (not q)", "¬p ∧ ¬q": "(not p) and (not q)"}),
        234: ("p -> q", {"¬q → ¬p": "(not q) -> (not p)", "q → p": "q -> p",
                         "¬p → ¬q": "(not p) -> (not q)", "p → ¬q": "p -> (not q)"}),
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


def test_afirmatii_generale_adevarat_fals():
    # id: (expresia care ar trebui să fie tautologie ca afirmația să fie adevărată)
    cazuri = {
        10: "(p and q) <-> (p or q)",              # „∧ e adevărată dacă cel puțin una e adevărată”
        16: "(p xor q) <-> (p <-> q)",             # „⊕ adevărat când au aceeași valoare”
        18: "(not (p and q)) <-> ((not p) and (not q))",
        129: "(p and q) -> (not (p or q))",       # „∨ falsă când ambele sunt adevărate”
        132: "p -> 1",                            # „implicația cu concluzia adevărată e adevărată”
        235: "(p -> q) <-> (q -> p)",
    }
    for id_intrebare in cazuri:
        e_tautologie = clasifica(cazuri[id_intrebare]) == "tautologie"
        asteptat = "Adevărat" if e_tautologie else "Fals"
        assert cauta(id_intrebare)["raspuns_corect"] == asteptat, id_intrebare


def test_deductii_noi():
    # 232: din p → q, q → r și p rezultă r (Modus Ponens de două ori)
    assert clasifica("((p -> q) and ((q -> r) and p)) -> r") == "tautologie"
    assert cauta(232)["raspuns_corect"] == "r este adevărată"
    # 233: din p → q și ¬p NU rezultă ¬q
    assert clasifica("((p -> q) and (not p)) -> (not q)") != "tautologie"
    assert cauta(233)["raspuns_corect"] == "Fals"
    # 237: p ⊕ p este mereu 0
    assert clasifica("p xor p") == "contradicție"
    assert cauta(237)["raspuns_corect"] == "0"
    # 241: sistemul expert al aplicației trage aceeași concluzie (Modus Tollens)
    regula = {"conditii": [({"intrebare": "", "da": "este weekend", "nu": "nu este weekend"}, True),
                           ({"intrebare": "", "da": "este soare", "nu": "nu este soare"}, True)],
              "concluzie": {"intrebare": "", "da": "merg în parc", "nu": "nu merg în parc"}}
    assert deduce(regula, [True, None], False)[:2] == ("Deci: nu este soare.", "Modus Tollens")
    assert cauta(241)["raspuns_corect"] == "Nu este soare (Modus Tollens)."


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

    # 139: True or False
    assert cauta(139)["raspuns_corect"] == str(True or False)

    # 140: parola „vacanta”
    parola = "vacanta"
    are_cifra = False
    for caracter in parola:
        if caracter.isdigit():
            are_cifra = True
    assert cauta(140)["raspuns_corect"] == ("Adevărat" if len(parola) >= 8 and are_cifra else "Fals")

    # 236: 0110 XOR 0110
    assert cauta(236)["raspuns_corect"] == format(0b0110 ^ 0b0110, "04b")

    # 137: pe câte rânduri este p ⊕ q adevărată
    randuri_adevarate = 0
    for rand in tabel_adevar("p xor q"):
        randuri_adevarate = randuri_adevarate + rand["rezultat"]
    assert cauta(137)["raspuns_corect"] == str(randuri_adevarate)

    # 226: doar varianta corectă are mereu aceeași valoare ca not (x > 0 or y > 0)
    variante = {
        "`x <= 0 and y <= 0`": lambda x, y: x <= 0 and y <= 0,
        "`x <= 0 or y <= 0`": lambda x, y: x <= 0 or y <= 0,
        "`x < 0 and y < 0`": lambda x, y: x < 0 and y < 0,
    }
    for varianta in variante:
        mereu_egale = True
        for x in range(-2, 3):
            for y in range(-2, 3):
                if variante[varianta](x, y) != (not (x > 0 or y > 0)):
                    mereu_egale = False
        assert mereu_egale == (varianta == cauta(226)["raspuns_corect"]), varianta

    # 239: x = 7, if x > 5 and not x > 10
    x = 7
    assert cauta(239)["raspuns_corect"] == ("A" if x > 5 and not x > 10 else "B")


# ---------- Funcțiile din evaluare.py ----------

def test_alege_10_intrebari_diferite_din_toate_temele():
    for incercare in range(20):  # alegerea e aleatoare, deci o verificăm de mai multe ori
        alese = alege_intrebari(INTREBARI, 1, [], NUMAR_INTREBARI_TEST)
        assert len(alese) == 10
        id_uri = [intrebare["id"] for intrebare in alese]
        assert len(set(id_uri)) == 10
        teme = set()
        for intrebare in alese:
            assert intrebare["nivel"] == 1
            teme.add(intrebare["tema"])
        # Nivelul 1 are 7 teme, iar 10 întrebări le acoperă pe toate.
        assert teme == teme_de_nivel(1)


def test_incadrarea_are_cate_o_intrebare_pe_tema():
    for incercare in range(20):
        alese = alege_intrebari(INTREBARI, 0, [], NUMAR_INTREBARI_INCADRARE)
        assert len(alese) == 6
        teme = [intrebare["tema"] for intrebare in alese]
        assert len(set(teme)) == 6


def test_testele_difera_intre_ele():
    primul = [q["id"] for q in alege_intrebari(INTREBARI, 1, [], NUMAR_INTREBARI_TEST)]
    alte_teste = 0
    for incercare in range(10):
        urmatorul = [q["id"] for q in alege_intrebari(INTREBARI, 1, [], NUMAR_INTREBARI_TEST)]
        if set(urmatorul) != set(primul):
            alte_teste = alte_teste + 1
    assert alte_teste >= 9


def test_reia_testul_alege_alte_intrebari():
    for nivel, numar in [(0, NUMAR_INTREBARI_INCADRARE), (1, NUMAR_INTREBARI_TEST), (2, NUMAR_INTREBARI_TEST)]:
        vazute = []
        # Primele teste nu repetă nicio întrebare, cât timp mai sunt întrebări nevăzute.
        for test in range(len(intrebari_de_nivel(INTREBARI, nivel)) // numar):
            alese = alege_intrebari(INTREBARI, nivel, vazute, numar)
            for intrebare in alese:
                assert intrebare["id"] not in vazute, (nivel, test)
                vazute.append(intrebare["id"])


def test_variantele_sunt_amestecate_corect():
    grila = cauta(4)             # 4 variante
    adevarat_fals = cauta(3)
    ordini = set()
    for incercare in range(30):
        copie = amesteca_variante(grila)
        assert sorted(copie["variante"]) == sorted(grila["variante"])
        assert copie["raspuns_corect"] == grila["raspuns_corect"]
        ordini.add(tuple(copie["variante"]))
        assert amesteca_variante(adevarat_fals)["variante"] == ["Adevărat", "Fals"]
    assert len(ordini) > 1                      # ordinea chiar se schimbă
    assert grila["variante"][0] == "p = 1, q = 1"  # originalul rămâne neschimbat


def test_scor_si_incadrare():
    intrebari = intrebari_de_nivel(INTREBARI, 0)[:6]
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
