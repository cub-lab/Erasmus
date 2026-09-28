"""Teste pentru motorul logic (logica.py). Se rulează cu comanda: pytest"""

from logica import valideaza, traduce, variabile_folosite, tabel_adevar, clasifica


def coloana_rezultat(expresie):
    """Ajutor: doar coloana „rezultat” din tabel, de ex. [1, 0, 0, 0]."""
    rezultate = []
    for rand in tabel_adevar(expresie):
        rezultate.append(rand["rezultat"])
    return rezultate


# ---------- Fiecare operator (rândurile sunt în ordinea 11, 10, 01, 00) ----------

def test_negatia():
    assert coloana_rezultat("not p") == [0, 1]


def test_conjunctia():
    assert coloana_rezultat("p and q") == [1, 0, 0, 0]


def test_disjunctia():
    assert coloana_rezultat("p or q") == [1, 1, 1, 0]


def test_implicatia():
    # Singurul caz fals: adevărat -> fals
    assert coloana_rezultat("p -> q") == [1, 0, 1, 1]


def test_echivalenta():
    assert coloana_rezultat("p <-> q") == [1, 0, 0, 1]


def test_xor():
    assert coloana_rezultat("p xor q") == [0, 1, 1, 0]


def test_constante():
    assert coloana_rezultat("1") == [1]
    assert coloana_rezultat("0") == [0]
    assert coloana_rezultat("p and 1") == [1, 0]


# ---------- Legile lui De Morgan, tautologii, contradicții ----------

def test_de_morgan_1():
    assert clasifica("(not (p and q)) <-> ((not p) or (not q))") == "tautologie"


def test_de_morgan_2():
    assert clasifica("(not (p or q)) <-> ((not p) and (not q))") == "tautologie"


def test_tautologie():
    assert clasifica("p or not p") == "tautologie"


def test_contradictie():
    assert clasifica("p and not p") == "contradicție"


def test_realizabila():
    assert clasifica("p and q") == "realizabilă"


def test_modus_ponens_e_tautologie():
    assert clasifica("((p -> q) and p) -> q") == "tautologie"


# ---------- Tabelul de adevăr și funcțiile ajutătoare ----------

def test_tabel_cu_trei_variabile():
    tabel = tabel_adevar("(p and q) -> r")
    assert len(tabel) == 8
    assert tabel[0] == {"p": 1, "q": 1, "r": 1, "rezultat": 1}
    assert tabel[1] == {"p": 1, "q": 1, "r": 0, "rezultat": 0}


def test_variabile_folosite():
    assert variabile_folosite("r or p") == ["p", "r"]
    assert variabile_folosite("1 and 0") == []


def test_traduce():
    assert traduce("(p and q) -> r") == "( p and q ) <= r"
    assert traduce("p <-> q") == "p == q"
    assert traduce("p xor 1") == "p != True"


def test_majuscule_acceptate():
    assert valideaza("P AND Q")[0] is True


# ---------- Validare: expresii corecte și respingeri ----------

def test_expresie_corecta():
    assert valideaza("(p and q) -> r") == (True, "Expresia este corectă.")


def test_respinge_import_os():
    corecta, mesaj = valideaza("import os")
    assert corecta is False
    assert "import" in mesaj


def test_respinge_cod_periculos():
    assert valideaza("__import__('os')")[0] is False
    assert valideaza("p.__class__")[0] is False


def test_respinge_simbol_necunoscut():
    corecta, mesaj = valideaza("p % q")
    assert corecta is False
    assert mesaj == "Nu recunosc simbolul «%». Folosește and, or, not, ->, <->, xor."


def test_sugestii_pentru_greseli_frecvente():
    assert valideaza("p & q")[1] == ("Nu recunosc simbolul «&». Folosește and, or, not, ->, <->, xor. "
                                     "Poate ai vrut să scrii «and»?")
    assert valideaza("p ∧ q")[1].endswith("«and»?")
    assert valideaza("p → q")[1].endswith("«->»?")
    assert valideaza("True")[1].endswith("«1»?")


def test_respinge_variabila_necunoscuta():
    assert valideaza("p and x") == (False, "Nu recunosc variabila «x». Folosește doar variabilele p, q și r.")


def test_cere_paranteze_la_implicatie():
    corecta, mesaj = valideaza("p and q -> r")
    assert corecta is False
    assert "paranteze" in mesaj


def test_cere_paranteze_la_negatie_si_xor():
    assert valideaza("not p xor q")[0] is False
    assert valideaza("(not p) xor q")[0] is True


def test_respinge_implicatii_inlantuite():
    assert valideaza("p -> q -> r")[0] is False
    assert valideaza("p -> (q -> r)")[0] is True


def test_respinge_paranteze_gresite():
    assert valideaza("(p and q")[0] is False
    assert valideaza("p and q)")[0] is False
    assert valideaza("p and ()")[0] is False


def test_respinge_expresii_incomplete():
    assert valideaza("")[0] is False
    assert valideaza("p and")[0] is False
    assert valideaza("p q")[0] is False
    assert valideaza("p (q)")[0] is False
    assert valideaza("10")[0] is False
