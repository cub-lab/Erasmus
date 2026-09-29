# 🧠 LogicLab

**Resursă Educațională Deschisă (RED) pentru învățarea personalizată a propozițiilor compuse și a aplicațiilor lor în informatică.**

Autor: **NUME_ELEV**, elev în clasa a IX-a, **LICEUL_MILITAR**
Public țintă: elevii de clasa a IX-a (Matematică: *Mulțimi și elemente de logică matematică*; Logică, argumentare și comunicare)

---

## Ce conține

| Secțiune | Ce face |
|---|---|
| 🏠 **Acasă** | Prezentarea resursei, obiectivele de învățare, licența |
| 🧭 **Test de încadrare** | 6 întrebări alese aleator (câte una pe temă) din 18. Sub 60%: Nivel 1 – Începător; minimum 60%: Nivel 2 – Avansat |
| 📖 **Lecții** | 10 lecții (negația, conjuncția, disjuncția, implicația, echivalența, XOR, De Morgan, tautologii, Modus Ponens / Tollens), fiecare cu un exercițiu verificat imediat |
| 🧮 **Generator de tabele de adevăr** | Scrii o expresie cu `p`, `q`, `r` și primești tabelul complet, plus răspunsul la întrebarea: tautologie, contradicție sau realizabilă? |
| 💡 **Unde se folosește?** | 6 demonstrații: porți logice, `if` în Python, validarea parolelor, SQL, criptografie XOR, sistem expert |
| 📝 **Teste pe niveluri** | 10 întrebări aleatoare din aproximativ 40 pe nivel, fără repetări cât timp mai sunt întrebări noi, explicație după fiecare răspuns, feedback personalizat pe teme; Nivelul 2 se deblochează cu minimum 70% la Nivel 1 |
| ℹ️ **Despre această resursă** | Fișa RED: licență, autor, instrucțiuni, bibliografie |

Aplicația nu cere cont și nu costă nimic. Nu colectează date personale: progresul se păstrează doar cât timp pagina este deschisă.

---

## Cum se rulează pe calculator

Ai nevoie de **Python 3.10** sau mai nou.

```bash
# 1. (o singură dată) creează un mediu virtual și instalează bibliotecile
python3 -m venv .venv
source .venv/bin/activate          # pe Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. pornește aplicația (se deschide în browser, la http://localhost:8501)
streamlit run app.py

# 3. rulează testele automate
pytest
```

---

## Structura proiectului

```
logiclab/
├── app.py              # interfața Streamlit și navigarea din bara laterală
├── logica.py           # motorul logic: validare, traducere, tabele de adevăr
├── lectii.py           # textele celor 10 lecții
├── evaluare.py         # testele: alegerea întrebărilor, scor, niveluri, feedback
├── aplicatii.py        # cele 6 demonstrații din „Unde se folosește?”
├── intrebari.json      # banca de întrebări (editabilă de orice profesor)
├── fisa_RED.md         # fișa descriptivă a resursei
├── LICENSE             # licențele MIT (cod) și CC BY-SA 4.0 (conținut)
├── requirements.txt    # streamlit, pytest
├── .streamlit/config.toml  # aspectul aplicației (mărimea fontului)
├── pytest.ini          # setări pentru pytest
└── tests/              # testele automate
```

### Cum funcționează motorul logic, în siguranță

Expresia scrisă de elev **nu** se execută direct. Programul o verifică în patru pași:

1. o împarte în simboluri și acceptă **doar** `p q r and or not -> <-> xor ( ) 1 0`, deci un text ca `import os` este respins;
2. verifică parantezele;
3. o traduce în Python: `->` devine `<=`, `<->` devine `==`, `xor` devine `!=`;
4. abia apoi o evaluează, fără acces la funcțiile Python (`{"__builtins__": {}}`).

Pentru că `<=`, `==` și `!=` au în Python altă prioritate decât în logică, aplicația cere paranteze în jurul părților compuse: se scrie `(p and q) -> r`, nu `p and q -> r`.

---

## 👩‍🏫 Pentru profesori: cum adaugi o întrebare nouă

Întrebările se află **doar** în fișierul `intrebari.json`. Nu trebuie să modifici codul.

**Pasul 1.** Deschide `intrebari.json` cu un editor de text (Notepad++, VS Code sau direct pe GitHub, cu butonul ✏️).

**Pasul 2.** Mergi la ultima întrebare din fișier. După acolada ei de închidere `}` pune o **virgulă**, apoi lipește întrebarea nouă:

```json
  {
    "id": 124,
    "nivel": 1,
    "tema": "conjuncția",
    "tip": "grila",
    "enunt": "Dacă p = 0 și q = 0, cât este p ∧ q?",
    "variante": ["1", "0"],
    "raspuns_corect": "0",
    "explicatie": "Conjuncția este adevărată doar când ambele propoziții sunt adevărate."
  }
```

Fișierul trebuie să se termine tot cu `]`.

**Pasul 3.** Completează câmpurile:

| Câmp | Ce scrii |
|---|---|
| `id` | un număr **nou**, nefolosit. Convenție: 1–99 încadrare, 101–199 Nivel 1, 201–299 Nivel 2 |
| `nivel` | `0` = încadrare, `1` = începător, `2` = avansat |
| `tema` | una dintre: `negația`, `conjuncția`, `disjuncția`, `implicația`, `echivalența`, `xor`, `de_morgan`, `tautologii`, `deducție`, `aplicații` |
| `tip` | `grila` (o singură variantă corectă) sau `adevarat_fals` (variantele sunt exact `["Adevărat", "Fals"]`) |
| `enunt` | textul întrebării (poți folosi `cod` între apostrofuri inverse) |
| `variante` | lista variantelor de răspuns, între ghilimele, separate prin virgulă |
| `raspuns_corect` | **exact** textul uneia dintre variante |
| `explicatie` | explicația afișată după răspuns |

**Pasul 4.** Verifică fișierul cu comanda `pytest`. Dacă ai uitat o virgulă sau ai scris un răspuns care nu e printre variante, testele îți spun unde este greșeala.

**Pasul 5.** Repornește aplicația (sau, dacă e publicată, salvează modificarea pe GitHub: aplicația se actualizează singură).

> ⚠️ **Cum alege aplicația întrebările:** la fiecare test, aleator: **6** la încadrare (câte una din fiecare temă) și **10** la testele pe niveluri (temele luate pe rând). Sunt preferate întrebările pe care elevul nu le-a văzut încă, iar variantele de la grilă se amestecă. Cu cât banca e mai mare, cu atât testele seamănă mai puțin între ele. Recomandare: **minimum 12** întrebări de încadrare (pe cel puțin 6 teme) și **minimum 30** pe fiecare nivel. Numerele 6 și 10 se schimbă din `evaluare.py` (`NUMAR_INTREBARI_INCADRARE`, `NUMAR_INTREBARI_TEST`).

---

## 🌐 Publicarea gratuită pe Streamlit Community Cloud

1. Fă-ți un cont gratuit pe [GitHub](https://github.com).
2. Creează un **depozit public** nou (butonul **New repository**), de exemplu `logiclab`.
3. Încarcă toate fișierele proiectului, **fără** folderul `.venv`. Poți folosi **Add file → Upload files** direct din browser.
4. Intră pe [share.streamlit.io](https://share.streamlit.io) și autentifică-te cu contul de GitHub.
5. Apasă **Create app**, alege depozitul `logiclab`, ramura `main` și fișierul `app.py`.
6. Apasă **Deploy**. În câteva minute primești un link public (de forma `https://….streamlit.app`), pe care îl poți trimite elevilor și comisiei.

La fiecare modificare salvată pe GitHub, aplicația publicată se actualizează automat.

---

## 📜 Licență

- **Codul** (fișierele `.py`) este sub licența **MIT**.
- **Conținutul educațional** (lecțiile, întrebările, textele, această documentație) este sub licența **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.ro)**.

Textul complet se află în fișierul [LICENSE](LICENSE). La reutilizare, menționează: *„LogicLab, de NUME_ELEV (LICEUL_MILITAR), licența CC BY-SA 4.0”*.
