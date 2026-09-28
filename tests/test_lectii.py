"""Verifică automat conținutul lecțiilor, ca să nu apară greșeli în tabele sau exerciții."""

from lectii import LECTII
from logica import valideaza, clasifica, tabel_adevar


def test_fiecare_lectie_are_toate_campurile():
    campuri = ["titlu", "nivel", "tema", "obiectiv", "definitie", "simbol",
               "scriere", "tabel", "exemplu", "exercitiu"]
    for lectie in LECTII:
        for camp in campuri:
            assert camp in lectie, lectie["titlu"] + " nu are câmpul " + camp


def test_expresiile_din_lectii_sunt_valide():
    for lectie in LECTII:
        # Lecția introductivă are la „scriere” doar lista simbolurilor, nu o expresie.
        if lectie["tema"] != "propoziții":
            assert valideaza(lectie["scriere"])[0], lectie["titlu"]
        for expresie, eticheta in lectie["tabel"]:
            assert valideaza(expresie)[0], expresie


def test_expresiile_din_acelasi_tabel_au_aceleasi_variabile():
    for lectie in LECTII:
        if len(lectie["tabel"]) > 1:
            numar_randuri = []
            for expresie, eticheta in lectie["tabel"]:
                numar_randuri.append(len(tabel_adevar(expresie)))
            assert len(set(numar_randuri)) == 1, lectie["titlu"]


def test_raspunsul_corect_este_printre_variante():
    for lectie in LECTII:
        exercitiu = lectie["exercitiu"]
        assert exercitiu["raspuns"] in exercitiu["variante"], lectie["titlu"]


def test_legile_din_lectii_sunt_tautologii():
    # „scriere” din lecțiile De Morgan, Tautologii și Modus Ponens trebuie să fie tautologii.
    for lectie in LECTII:
        if lectie["tema"] in ["de_morgan", "tautologii", "deducție"]:
            assert clasifica(lectie["scriere"]) == "tautologie", lectie["titlu"]
    assert clasifica("((p -> q) and (not q)) -> (not p)") == "tautologie"  # Modus Tollens
    assert clasifica("(not (p or q)) <-> ((not p) and (not q))") == "tautologie"  # De Morgan 2


def test_raspunsurile_exercitiilor_calculate_cu_motorul():
    # Exercițiile cu 1/0, recalculate cu motorul logic.
    assert tabel_adevar("not 0")[0]["rezultat"] == 1          # ¬p, p = „5 e par” = 0
    assert tabel_adevar("1 and 0")[0]["rezultat"] == 0        # 2 < 3 și 3 < 1
    assert tabel_adevar("1 or 0")[0]["rezultat"] == 1         # 7 prim sau 7 par
    assert tabel_adevar("0 -> 0")[0]["rezultat"] == 1         # dacă 2 + 2 = 5, atunci...
    assert tabel_adevar("1 <-> 0")[0]["rezultat"] == 0        # 4 par ↔ 4 > 10
    assert tabel_adevar("1 xor 1")[0]["rezultat"] == 0        # p = 1, q = 1
    assert clasifica("p -> p") == "tautologie"
