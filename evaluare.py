"""
Logica testelor din LogicLab: încărcarea întrebărilor, alegerea lor,
calculul scorului, încadrarea pe niveluri și feedbackul pe teme.

Aici nu există nimic legat de interfață, ca funcțiile să poată fi testate cu pytest.
"""

import json
import os
import random

from lectii import LECTII

# Fișierul cu întrebări se află în același folder cu acest program.
FISIER_INTREBARI = os.path.join(os.path.dirname(__file__), "intrebari.json")

NUMAR_INTREBARI_TEST = 10
PRAG_INCADRARE = 60   # minimum 60% la încadrare => Nivel 2
PRAG_DEBLOCARE = 70   # minimum 70% la Nivel 1 => se deblochează Nivel 2

# Cum apare fiecare temă în mesajele de feedback („... întrebări despre implicație”).
TEME_TEXT = {
    "negația": "negație",
    "conjuncția": "conjuncție",
    "disjuncția": "disjuncție",
    "implicația": "implicație",
    "echivalența": "echivalență",
    "xor": "disjuncția exclusivă (XOR)",
    "de_morgan": "legile lui De Morgan",
    "tautologii": "tautologii și contradicții",
    "deducție": "deducție (Modus Ponens și Modus Tollens)",
    "aplicații": "aplicații în informatică",
}


def incarca_intrebari():
    """Citește toate întrebările din intrebari.json."""
    with open(FISIER_INTREBARI, encoding="utf-8") as fisier:
        return json.load(fisier)


def intrebari_de_nivel(intrebari, nivel):
    """Păstrează doar întrebările de nivelul cerut (0, 1 sau 2)."""
    rezultat = []
    for intrebare in intrebari:
        if intrebare["nivel"] == nivel:
            rezultat.append(intrebare)
    return rezultat


def alege_intrebari(intrebari, nivel, folosite_inainte):
    """Alege aleator 10 întrebări de nivelul dat.

    Preferă întrebările care NU au fost în testul anterior (folosite_inainte = listă de id-uri),
    ca la „Reia testul” elevul să primească alte întrebări.
    """
    toate = intrebari_de_nivel(intrebari, nivel)
    numar = min(NUMAR_INTREBARI_TEST, len(toate))

    noi = []
    vechi = []
    for intrebare in toate:
        if intrebare["id"] in folosite_inainte:
            vechi.append(intrebare)
        else:
            noi.append(intrebare)

    if len(noi) >= numar:
        alese = random.sample(noi, numar)
    else:
        # Nu sunt destule întrebări noi: le luăm pe toate și completăm cu câteva vechi.
        alese = noi + random.sample(vechi, numar - len(noi))
        random.shuffle(alese)
    return alese


def numara_corecte(intrebari, raspunsuri):
    """Câte răspunsuri sunt corecte (raspunsuri[i] este răspunsul la intrebari[i])."""
    corecte = 0
    for i in range(len(intrebari)):
        if raspunsuri[i] == intrebari[i]["raspuns_corect"]:
            corecte = corecte + 1
    return corecte


def procent(corecte, total):
    """Procentul de răspunsuri corecte, rotunjit la un număr întreg."""
    if total == 0:
        return 0
    return round(corecte * 100 / total)


def nivel_dupa_incadrare(procent_obtinut):
    """Sub 60% => Nivel 1 (Începător); minimum 60% => Nivel 2 (Avansat)."""
    if procent_obtinut < PRAG_INCADRARE:
        return 1
    return 2


def nivel2_deblocat(nivel_incadrare, cel_mai_bun_scor_nivel1):
    """Nivel 2 e deschis dacă elevul a fost încadrat direct la Nivel 2
    sau a obținut minimum 70% la testul de Nivel 1."""
    if nivel_incadrare == 2:
        return True
    if cel_mai_bun_scor_nivel1 is not None and cel_mai_bun_scor_nivel1 >= PRAG_DEBLOCARE:
        return True
    return False


def statistici_pe_teme(intrebari, raspunsuri):
    """Pentru fiecare temă: câte întrebări au fost și câte au fost greșite.

    Exemplu de rezultat: {"implicația": {"total": 4, "gresite": 3}, ...}
    """
    statistici = {}
    for i in range(len(intrebari)):
        tema = intrebari[i]["tema"]
        if tema not in statistici:
            statistici[tema] = {"total": 0, "gresite": 0}
        statistici[tema]["total"] = statistici[tema]["total"] + 1
        if raspunsuri[i] != intrebari[i]["raspuns_corect"]:
            statistici[tema]["gresite"] = statistici[tema]["gresite"] + 1
    return statistici


def titlu_lectie_pentru_tema(tema):
    """Titlul lecției care explică o temă, de ex. „implicația” -> „Implicația”."""
    for lectie in LECTII:
        if lectie["tema"] == tema:
            return lectie["titlu"]
    return None


def mesaje_feedback(statistici):
    """Construiește mesajele de feedback pentru temele la care elevul a greșit.

    Întoarce o listă de perechi (tema, mesaj), cu temele cele mai greșite primele.
    Exemplu: ("implicația", "Ai greșit 3 din 4 întrebări despre implicație. Recitește lecția «Implicația».")
    """
    # Facem perechi (număr de greșeli, temă). Python sortează perechile după primul element,
    # iar reverse=True pune temele cu cele mai multe greșeli primele.
    perechi = []
    for tema in statistici:
        if statistici[tema]["gresite"] > 0:
            perechi.append((statistici[tema]["gresite"], tema))
    perechi.sort(reverse=True)

    mesaje = []
    for numar_gresite, tema in perechi:
        gresite = statistici[tema]["gresite"]
        total = statistici[tema]["total"]
        if total == 1:
            cuvant = "întrebare"
        else:
            cuvant = "întrebări"
        mesaj = ("Ai greșit " + str(gresite) + " din " + str(total) + " " + cuvant
                 + " despre " + TEME_TEXT.get(tema, tema) + ". ")

        titlu = titlu_lectie_pentru_tema(tema)
        if titlu is not None:
            mesaj = mesaj + "Recitește lecția «" + titlu + "»."
        else:
            mesaj = mesaj + "Revezi secțiunea «Unde se folosește?»."
        mesaje.append((tema, mesaj))
    return mesaje
