"""
Motorul logic al aplicației LogicLab.

Elevul scrie expresii cu: p, q, r, and, or, not, ->, <->, xor, paranteze, 1, 0.
Pașii sunt:
  1. valideaza()  – verificăm că expresia conține DOAR simboluri permise;
  2. traduce()    – o transformăm într-o expresie Python;
  3. tabel_adevar() și clasifica() – o evaluăm pentru toate combinațiile de valori.
"""

from itertools import product

# Simbolurile pe care le acceptăm. Orice altceva este respins.
VARIABILE = ["p", "q", "r"]
SIMBOLURI_PERMISE = VARIABILE + ["and", "or", "not", "->", "<->", "xor", "(", ")", "1", "0"]

# Cum se traduce fiecare simbol logic în Python.
# Pentru valori booleene (True/False):
#   p <= q  este exact implicația p -> q (singurul caz fals: True <= False)
#   p == q  este echivalența
#   p != q  este disjuncția exclusivă (xor)
TRADUCERI = {
    "->": "<=",
    "<->": "==",
    "xor": "!=",
    "1": "True",
    "0": "False",
}

# Operatorii care, în Python, au altă prioritate decât în logică.
# De aceea cerem paranteze în jurul operanzilor lor compuși.
OPERATORI_SPECIALI = ["->", "<->", "xor"]
TOTI_OPERATORII = ["and", "or", "not"] + OPERATORI_SPECIALI

MESAJ_SIMBOLURI = "Folosește and, or, not, ->, <->, xor."

# Greșeli frecvente și ce a vrut probabil elevul să scrie.
SUGESTII = {
    "&": "and", "∧": "and", "si": "and", "și": "and",
    "|": "or", "∨": "or", "v": "or", "sau": "or",
    "!": "not", "~": "not", "¬": "not", "non": "not",
    "→": "->", "=": "<->", "↔": "<->", "≡": "<->",
    "⊕": "xor", "^": "xor", "w": "xor",
    "true": "1", "false": "0",
}


def imparte_in_simboluri(expresie):
    """Împarte textul în simboluri (tokeni).

    Exemplu: "(p and q) -> r"  devine  ["(", "p", "and", "q", ")", "->", "r"]
    Caracterele necunoscute devin și ele simboluri, ca să le putem semnala.
    """
    text = expresie.lower()  # acceptăm și „P AND Q” (telefonul pune des majusculă)
    simboluri = []
    i = 0
    while i < len(text):
        caracter = text[i]
        if caracter.isspace():
            i = i + 1
        elif text.startswith("<->", i):
            simboluri.append("<->")
            i = i + 3
        elif text.startswith("->", i):
            simboluri.append("->")
            i = i + 2
        elif caracter.isalnum() or caracter == "_":
            # Citim un cuvânt întreg: litere, cifre sau „_” (de ex. „and”, „p”, „import”).
            inceput = i
            while i < len(text) and (text[i].isalnum() or text[i] == "_"):
                i = i + 1
            simboluri.append(text[inceput:i])
        else:
            # Un singur caracter: paranteză sau ceva necunoscut (de ex. „&”).
            simboluri.append(caracter)
            i = i + 1
    return simboluri


def verifica_paranteze(simboluri):
    """Verifică parantezele și regula de prioritate.

    Regula: dacă într-un grup (între aceleași paranteze) apare ->, <-> sau xor,
    atunci acel operator trebuie să fie SINGURUL operator din grup.
    Astfel  (p and q) -> r  este acceptat, dar  p and q -> r  nu.

    Folosim o stivă: fiecare „(” deschide un grup nou, iar în fiecare grup
    reținem operatorii care apar direct în el (nu în subgrupuri).
    Întoarce un mesaj de eroare sau "" dacă totul e în regulă.
    """
    stiva = [[]]  # grupul din afara oricărei paranteze
    for i in range(len(simboluri)):
        simbol = simboluri[i]
        if simbol == "(":
            if i + 1 < len(simboluri) and simboluri[i + 1] == ")":
                return "Ai scris paranteze goale „()”. Pune ceva între ele."
            stiva.append([])
        elif simbol == ")":
            if len(stiva) == 1:
                return "Ai o paranteză „)” în plus."
            grup = stiva.pop()
            mesaj = verifica_grup(grup)
            if mesaj != "":
                return mesaj
        elif simbol in TOTI_OPERATORII:
            stiva[-1].append(simbol)

    if len(stiva) > 1:
        return "Ai deschis o paranteză „(” pe care nu ai închis-o."
    return verifica_grup(stiva[0])


def verifica_grup(operatori):
    """Un grup cu ->, <-> sau xor nu are voie să conțină alți operatori."""
    for operator in operatori:
        if operator in OPERATORI_SPECIALI and len(operatori) > 1:
            return ("Pune paranteze în jurul părților compuse din jurul lui «" + operator
                    + "». De exemplu: (p and q) -> r, nu p and q -> r.")
    return ""


def valideaza(expresie):
    """Verifică dacă expresia poate fi evaluată în siguranță.

    Întoarce o pereche (corecta, mesaj), de exemplu:
      (True, "Expresia este corectă.")
      (False, "Nu recunosc simbolul «&». Folosește and, or, not, ->, <->, xor.")
    """
    simboluri = imparte_in_simboluri(expresie)
    if len(simboluri) == 0:
        return False, "Scrie o expresie, de exemplu: p and not q."

    # 1. Doar simboluri permise (aici oprim orice cod periculos, de ex. „import os”).
    for simbol in simboluri:
        if simbol not in SIMBOLURI_PERMISE:
            # O singură literă (de ex. „a” sau „x”) este, probabil, o variabilă nepermisă.
            if len(simbol) == 1 and simbol.isalpha() and simbol not in SUGESTII:
                return False, "Nu recunosc variabila «" + simbol + "». Folosește doar variabilele p, q și r."
            mesaj = "Nu recunosc simbolul «" + simbol + "». " + MESAJ_SIMBOLURI
            if simbol in SUGESTII:
                mesaj = mesaj + " Poate ai vrut să scrii «" + SUGESTII[simbol] + "»?"
            return False, mesaj

    # 2. Paranteze corecte și regula de prioritate.
    mesaj = verifica_paranteze(simboluri)
    if mesaj != "":
        return False, mesaj

    # 3. Ordinea simbolurilor: încercăm expresia cu toate variabilele adevărate.
    #    Dacă Python nu o înțelege (de ex. „p and” sau „p q”), e scrisă greșit.
    #    Este sigur, pentru că am verificat deja fiecare simbol.
    valori = {}
    for variabila in VARIABILE:
        valori[variabila] = True
    try:
        rezultat = eval(traduce(expresie), {"__builtins__": {}}, valori)
    except Exception:
        return False, "Expresia nu este scrisă corect. Verifică dacă lipsește o variabilă sau un operator."
    if not isinstance(rezultat, bool):
        return False, "Expresia nu este scrisă corect. Verifică dacă lipsește o variabilă sau un operator."

    return True, "Expresia este corectă."


def traduce(expresie):
    """Traduce o expresie logică (deja validată) în Python.

    Exemplu: "(p and q) -> r"  devine  "( p and q ) <= r"
    """
    simboluri = imparte_in_simboluri(expresie)
    rezultat = []
    for simbol in simboluri:
        if simbol in TRADUCERI:
            rezultat.append(TRADUCERI[simbol])
        else:
            rezultat.append(simbol)
    return " ".join(rezultat)


def variabile_folosite(expresie):
    """Întoarce variabilele din expresie, în ordine: de exemplu ["p", "r"]."""
    simboluri = imparte_in_simboluri(expresie)
    gasite = []
    for variabila in VARIABILE:
        if variabila in simboluri:
            gasite.append(variabila)
    return gasite


def tabel_adevar(expresie):
    """Construiește tabelul de adevăr al unei expresii (deja validate).

    Întoarce o listă de rânduri; fiecare rând e un dicționar, de exemplu:
      {"p": 1, "q": 0, "rezultat": 0}
    Rândurile încep cu 1 (adevărat), ca în manual: 11, 10, 01, 00.
    """
    variabile = variabile_folosite(expresie)
    cod_python = traduce(expresie)
    tabel = []
    # product([True, False], repeat=2) dă toate combinațiile:
    # (True, True), (True, False), (False, True), (False, False)
    for combinatie in product([True, False], repeat=len(variabile)):
        valori = {}
        for i in range(len(variabile)):
            valori[variabile[i]] = combinatie[i]
        rezultat = eval(cod_python, {"__builtins__": {}}, valori)

        rand = {}
        for variabila in variabile:
            rand[variabila] = int(valori[variabila])  # True -> 1, False -> 0
        rand["rezultat"] = int(rezultat)
        tabel.append(rand)
    return tabel


def clasifica(expresie):
    """Spune dacă expresia e „tautologie”, „contradicție” sau „realizabilă”.

    - tautologie:   adevărată pe toate rândurile;
    - contradicție: falsă pe toate rândurile;
    - realizabilă:  adevărată pe cel puțin un rând (dar nu pe toate).
    """
    rezultate = []
    for rand in tabel_adevar(expresie):
        rezultate.append(rand["rezultat"])
    if 0 not in rezultate:
        return "tautologie"
    if 1 not in rezultate:
        return "contradicție"
    return "realizabilă"
