"""Teste pentru funcțiile de calcul din secțiunea „Unde se folosește?” (aplicatii.py)."""

from aplicatii import (poarta, verifica_parola, filtreaza_elevi, ELEVI, in_binar, xor_text,
                       coduri_text, text_din_coduri, REGULI, text_regula, deduce)


def test_porti_logice():
    assert poarta("AND", True, False) is False
    assert poarta("AND", True, True) is True
    assert poarta("OR", False, True) is True
    assert poarta("OR", False, False) is False
    assert poarta("XOR", True, True) is False
    assert poarta("XOR", True, False) is True
    assert poarta("NOT", True, False) is False
    assert poarta("NOT", False, True) is True


def test_parola():
    assert verifica_parola("Soare123") == (True, True, True)
    assert verifica_parola("soare123") == (True, False, True)
    assert verifica_parola("Ab1") == (False, True, True)
    assert verifica_parola("") == (False, False, False)


def test_filtru_sql():
    and_ = filtreaza_elevi(ELEVI, "București", 15, "AND")
    nume = [elev["nume"] for elev in and_]
    assert nume == ["Dan", "Gabriela"]  # din București ȘI peste 15 ani

    or_ = filtreaza_elevi(ELEVI, "București", 16, "OR")
    nume = [elev["nume"] for elev in or_]
    assert nume == ["Ana", "Dan", "Gabriela", "Horia", "Mihai"]  # din București SAU peste 16 ani


def test_binar():
    assert in_binar(65) == "01000001"
    assert in_binar(0) == "00000000"


def test_xor_de_doua_ori_da_textul_initial():
    coduri = coduri_text("LOGICA")
    criptat = xor_text(coduri, "K")
    assert criptat != coduri
    assert text_din_coduri(xor_text(criptat, "K")) == "LOGICA"
    # L = 76 = 01001100, K = 75 = 01001011, XOR = 00000111 = 7
    assert criptat[0] == 7


def test_text_regula():
    assert text_regula(REGULI[0]) == "Dacă plouă ȘI nu am umbrelă, atunci mă ud."


def test_sistem_expert():
    ploaia = REGULI[0]  # Dacă plouă ȘI nu am umbrelă, atunci mă ud.
    # Modus Ponens: plouă, nu am umbrelă
    assert deduce(ploaia, [True, False], None)[:2] == ("Deci: mă ud.", "Modus Ponens")
    # Modus Tollens: nu m-am udat, dar plouă -> am umbrelă
    assert deduce(ploaia, [True, None], False)[:2] == ("Deci: am umbrelă.", "Modus Tollens")
    # Modus Tollens + De Morgan: nu m-am udat, nu știm nimic altceva
    assert deduce(ploaia, [None, None], False)[:2] == ("Deci: nu plouă SAU am umbrelă.",
                                                       "Modus Tollens + De Morgan")
    # Ipoteza falsă: nu plouă -> nu știm dacă mă ud
    assert deduce(ploaia, [False, None], None)[1] == "Ipoteza este falsă"
    # Greșeala: m-am udat nu înseamnă sigur că plouă
    assert deduce(ploaia, [None, None], True)[1] == "Greșeală de evitat"
    # Contradicție
    assert deduce(ploaia, [True, False], False)[1] == "Contradicție"
    # Prea puține informații
    assert deduce(ploaia, [None, None], None)[1] == "—"
