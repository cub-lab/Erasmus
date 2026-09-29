# Fișa resursei educaționale deschise

| | |
|---|---|
| **Titlu** | LogicLab – Propoziții compuse și aplicațiile lor în informatică |
| **Autor** | NUME_ELEV, elev în clasa a IX-a, LICEUL_MILITAR |
| **Tipul resursei** | Aplicație web interactivă (lecții, exerciții, simulări, teste cu feedback) |
| **Disciplina** | Matematică (*Mulțimi și elemente de logică matematică*); Logică, argumentare și comunicare; conexiuni cu Informatica |
| **Clasa** | a IX-a |
| **Public țintă** | Elevi de clasa a IX-a; profesori de matematică, logică și informatică |
| **Durată estimată** | aprox. 2 × 50 de minute |
| **Niveluri de dificultate** | Nivel 1 – Începător; Nivel 2 – Avansat |
| **Limba** | română |
| **Licență** | Conținut: CC BY-SA 4.0 · Cod: MIT |
| **Cost / cont** | Gratuit, fără cont, fără date personale colectate |

## Competențe vizate

*(formulate după programele școlare de clasa a IX-a; pot fi completate cu formularea exactă din programă)*

1. Identificarea propozițiilor și a valorii lor de adevăr, în limbajul cotidian și în matematică.
2. Folosirea operatorilor logici (negație, conjuncție, disjuncție, implicație, echivalență, disjuncție exclusivă) pentru a construi și a interpreta propoziții compuse.
3. Construirea și interpretarea tabelelor de adevăr.
4. Recunoașterea raționamentelor corecte (Modus Ponens, Modus Tollens) și a greșelilor de raționament.
5. Transferul cunoștințelor de logică în contexte din informatică: programare, baze de date, circuite, securitate.

## Obiective de învățare

La finalul activității, elevul va putea:

1. să deosebească o propoziție simplă de una compusă și să îi stabilească valoarea de adevăr (1/0);
2. să calculeze valoarea de adevăr a propozițiilor compuse cu ¬, ∧, ∨, →, ↔, ⊕;
3. să construiască tabelul de adevăr al unei expresii și să spună dacă este tautologie, contradicție sau realizabilă;
4. să aplice legile lui De Morgan și regulile Modus Ponens și Modus Tollens;
5. să recunoască logica propozițiilor în condiții `if`, reguli de validare, interogări SQL, porți logice și criptarea XOR.

## Cum funcționează învățarea personalizată

1. **Testul de încadrare** (6 întrebări alese aleator, câte una pe temă, dintr-o bancă de 18) îl încadrează pe elev la Nivel 1 (sub 60%) sau la Nivel 2 (minimum 60%).
2. **Lecțiile** se parcurg în ritmul fiecăruia. Fiecare lecție are un exercițiu cu verificare imediată.
3. **Testele pe niveluri** au câte 10 întrebări alese aleator din aproximativ 40 pe nivel, fără să se repete cât timp mai sunt întrebări noi. După fiecare răspuns, elevul vede explicația.
4. **Feedbackul personalizat pe teme** îi arată elevului exact ce lecții să recitească, de exemplu: „Ai greșit 3 din 4 întrebări despre implicație. Recitește lecția «Implicația».”
5. **Nivelul 2 se deblochează** după minimum 70% la Nivel 1 sau dacă elevul a fost încadrat direct la Nivel 2.

## Instrucțiuni pentru elevi

1. Deschide aplicația (nu ai nevoie de cont).
2. Dă **testul de încadrare** din pagina *Acasă*.
3. Parcurge **lecțiile** recomandate și rezolvă exercițiul de la finalul fiecăreia.
4. Exersează în **Generatorul de tabele de adevăr** cu propriile tale expresii.
5. Explorează secțiunea **Unde se folosește?** ca să vezi logica în informatică.
6. Dă **testul pe nivelul tău**, citește feedbackul și reia testul (primești alte întrebări).

## Instrucțiuni pentru profesori

**Scenariu propus (2 × 50 de minute):**

| Ora | Activitate | Timp |
|---|---|---|
| 1 | Test de încadrare | 10 min |
| 1 | Lecții (fiecare elev pe nivelul lui) | 25 min |
| 1 | Generatorul de tabele de adevăr: exerciții libere | 15 min |
| 2 | Unde se folosește? (6 demonstrații, pe grupe) | 20 min |
| 2 | Teste pe niveluri | 25 min |
| 2 | Discuție pe baza feedbackului | 5 min |

**Cum adaptezi resursa:**

- **Întrebările** se modifică doar din fișierul `intrebari.json`, fără să schimbi codul.
- **Textele lecțiilor** se află în fișierul `lectii.py`.
- Comanda `pytest` verifică automat dacă întrebările și lecțiile sunt scrise corect.

**Cum adaugi o întrebare nouă (pe scurt):**

1. Deschide `intrebari.json` într-un editor de text.
2. Copiază o întrebare existentă (de la `{` până la `}`) și pune o virgulă între ea și cea anterioară.
3. Schimbă `id` (un număr nou, nefolosit), `nivel` (0, 1 sau 2), `tema`, `tip` (`grila` sau `adevarat_fals`), `enunt`, `variante`, `raspuns_corect` (scris exact ca una dintre variante) și `explicatie`.
4. Salvează și repornește aplicația. Pașii detaliați se află în `README.md`.

## Cerințe tehnice

- **Pentru elevi:** orice browser modern, pe calculator, tabletă sau telefon, cu conexiune la internet.
- **Pentru rulare locală:** Python 3.10 sau mai nou, bibliotecile `streamlit` și `pytest`.
- Resursa nu folosește baze de date, conturi sau servicii externe. Progresul se păstrează doar cât timp pagina este deschisă.

## Accesibilitate

- Text clar, în limba română, cu diacritice.
- Informația nu depinde doar de culori: se folosesc și simbolurile ✅/❌, 💡/⚫.
- Text mărit (18 px), ușor de citit și pe telefon.
- Aplicația funcționează și pe telefon.

## Licență și reutilizare

- **Conținutul educațional** (lecții, întrebări, texte) este sub licența [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.ro): îl poți copia, modifica și distribui, cu menționarea autorului și sub aceeași licență.
- **Codul** este sub licența [MIT](https://opensource.org/license/mit): îl poți folosi liber, păstrând mențiunea de copyright.
- La reutilizare, menționează: *„LogicLab, de NUME_ELEV (LICEUL_MILITAR), licența CC BY-SA 4.0”*.

## Bibliografie

1. Manualul de Matematică pentru clasa a IX-a, capitolul *Mulțimi și elemente de logică matematică* (se completează autorii, editura și anul manualului folosit la clasă).
2. Manualul de Logică, argumentare și comunicare pentru clasa a IX-a (se completează autorii, editura și anul).
3. *LOGICA, argumentare și comunicare – suport de curs*, Colegiul „General Magheru”, 2017 (resursă educațională deschisă): https://generalmagheru.ro/files/resurse_educationale/2017/socio_umane/LOGICA_suport%20de%20curs.pdf
4. The Open Logic Project, manual deschis de logică (CC BY): https://openlogicproject.org
5. Documentația Python, *Boolean Operations – and, or, not*: https://docs.python.org/3/library/stdtypes.html#boolean-operations-and-or-not
6. Documentația Streamlit: https://docs.streamlit.io
