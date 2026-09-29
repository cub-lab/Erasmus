import json, os, sys, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

DIR = sys.argv[1]
INTREBARI = json.load(open(os.path.join(os.path.dirname(__file__), "..", "..", "intrebari.json"), encoding="utf-8"))
LAT_PC, LAT_TEL = 1280, 390

o = webdriver.ChromeOptions()
o.add_argument("--headless=new"); o.add_argument("--hide-scrollbars")
o.add_argument("--force-device-scale-factor=2")
o.add_argument(f"--window-size={LAT_PC},1000")
d = webdriver.Chrome(options=o)


def pauza(t=1.8):
    time.sleep(t)


def curata():
    # ascundem bara de dezvoltator (butonul Deploy și meniul), care nu apare pentru elevi
    d.execute_script("""
      for (const s of ['[data-testid="stToolbar"]', '[data-testid="stDecoration"]', '[data-testid="stStatusWidget"]']) {
        const e = document.querySelector(s); if (e) e.style.visibility = 'hidden'; }""")


def bara_deschisa():
    el = d.find_elements(By.CSS_SELECTOR, '[data-testid="stSidebar"]')
    return bool(el) and el[0].get_attribute("aria-expanded") == "true"


def deschide_bara():
    if not bara_deschisa():
        for b in d.find_elements(By.CSS_SELECTOR, '[data-testid="stExpandSidebarButton"], [data-testid="stSidebarCollapsedControl"] button'):
            try: b.click(); pauza(1); return
            except Exception: pass


def inchide_bara():
    if bara_deschisa():
        for b in d.find_elements(By.CSS_SELECTOR, '[data-testid="stSidebarCollapseButton"] button, [data-testid="stSidebarCollapseButton"]'):
            try: b.click(); pauza(1); return
            except Exception: pass


def mergi(text):
    deschide_bara()
    for el in d.find_elements(By.CSS_SELECTOR, '[data-testid="stSidebar"] label'):
        if text in el.text:
            el.click(); pauza(2.5); return
    raise Exception("nu găsesc secțiunea " + text)


def buton(text):
    for b in d.find_elements(By.CSS_SELECTOR, '[data-testid="stMain"] button'):
        if text in b.text and b.is_enabled():
            d.execute_script("arguments[0].scrollIntoView({block:'center'})", b); pauza(0.3)
            b.click(); pauza(2.2); return
    raise Exception("nu găsesc butonul " + text + ": " + str([b.text for b in d.find_elements(By.CSS_SELECTOR, '[data-testid="stMain"] button')]))


def grupuri_radio():
    return d.find_elements(By.CSS_SELECTOR, '[data-testid="stMain"] [data-testid="stRadio"]')


def alege(grup, text):
    for l in grup.find_elements(By.CSS_SELECTOR, 'label[data-testid="stRadioOption"]'):
        if l.text.strip() == text.replace("`", "").replace("**", ""):  # pe ecran, codul apare fără `
            d.execute_script("arguments[0].scrollIntoView({block:'center'})", l); pauza(0.2)
            l.click(); pauza(1.2); return
    raise Exception("nu găsesc varianta " + text + " în " + grup.text[:60])


def scrie(eticheta, text):
    for c in d.find_elements(By.CSS_SELECTOR, '[data-testid="stMain"] [data-testid="stTextInput"]'):
        if eticheta in c.text:
            i = c.find_element(By.TAG_NAME, "input")
            i.click(); i.send_keys(Keys.COMMAND, "a"); i.send_keys(Keys.BACKSPACE)
            i.send_keys(text); i.send_keys(Keys.ENTER); pauza(2); return
    raise Exception("nu găsesc câmpul " + eticheta)


def tab(text):
    for t in d.find_elements(By.CSS_SELECTOR, '[data-testid="stMain"] [data-testid="stTab"]'):
        if text in t.text:
            t.click(); pauza(1.2); return
    raise Exception("nu găsesc tabul " + text)


def inaltime():
    return d.execute_script("""
      const m = document.querySelector('[data-testid="stMain"]');
      return Math.max(document.documentElement.scrollHeight, m ? m.scrollHeight : 0);""")


def poza(nume, latime=LAT_PC, element=None, max_h=3200):
    """Captură: fereastra întreagă (element=None) sau doar un element."""
    d.set_window_size(latime, 1000); pauza(1)
    if latime == LAT_TEL:
        inchide_bara()
    curata()
    h = min(inaltime() + 60, max_h)
    d.set_window_size(latime, h); pauza(1.5); curata()
    d.execute_script("const m=document.querySelector('[data-testid=\"stMain\"]'); if(m) m.scrollTop=0; window.scrollTo(0,0);")
    pauza(0.5)
    if element:
        el = d.find_element(By.CSS_SELECTOR, element)
        el.screenshot(f"{DIR}/{nume}.png")
    else:
        d.save_screenshot(f"{DIR}/{nume}.png")
    print("  ✓", nume)
    if latime == LAT_TEL:
        d.set_window_size(LAT_PC, 1000); pauza(1.5); deschide_bara()
    else:
        d.set_window_size(LAT_PC, 1000); pauza(0.8)


MAIN = '[data-testid="stMainBlockContainer"]'

d.get("http://localhost:8501"); pauza(7)

print("Acasă")
poza("acasa_pc")
poza("acasa_tel", LAT_TEL)

print("Test de încadrare")
buton("Începe testul de încadrare")
# încadrarea alege aleator 6 din 18: recunoaștem întrebările după enunț, în ordinea de pe pagină
text_pagina = d.find_element(By.CSS_SELECTOR, '[data-testid="stMain"]').text
afisate = []
for q in INTREBARI:
    if q["nivel"] == 0 and q["enunt"] in text_pagina:
        afisate.append((text_pagina.index(q["enunt"]), q))
afisate.sort(key=lambda pereche: pereche[0])
assert len(afisate) == 6, len(afisate)
for i, (poz, q) in enumerate(afisate):
    corect = q["raspuns_corect"]
    gresit = [v for v in q["variante"] if v != corect][0]
    alege(grupuri_radio()[i], corect if i != 3 else gresit)  # 5 din 6 corecte
poza("incadrare_pc", element=MAIN)
buton("Vezi rezultatul")
poza("incadrare_rezultat_pc", element=MAIN)

print("Lecții")
mergi("Lecții")
sb = d.find_element(By.CSS_SELECTOR, '[data-testid="stMain"] [data-testid="stSelectbox"]')
sb.click(); pauza(0.8)
inp = sb.find_element(By.TAG_NAME, "input"); inp.send_keys("Implicația"); pauza(0.8); inp.send_keys(Keys.ENTER); pauza(2.5)
alege(grupuri_radio()[-1], "1")
poza("lectie_pc", element=MAIN)
poza("lectie_tel", LAT_TEL)

print("Generator")
mergi("Generator")
scrie("Expresia ta", "(p -> q) <-> ((not q) -> (not p))")
poza("generator_pc", element=MAIN)
poza("generator_tel", LAT_TEL)
scrie("Expresia ta", "p & q")
poza("generator_eroare_pc", element='[data-testid="stMain"] [data-testid="stAlert"]')
scrie("Expresia ta", "p and q -> r")
poza("generator_paranteze_pc", element='[data-testid="stMain"] [data-testid="stAlert"] ~ [data-testid="stAlert"], [data-testid="stMain"] [data-testid="stElementContainer"]:has([data-testid="stAlertContentError"])')

print("Unde se folosește?")
mergi("Unde se folosește")
alege(grupuri_radio()[0], "XOR")
for c in d.find_elements(By.CSS_SELECTOR, '[data-testid="stMain"] [data-testid="stCheckbox"]'):
    if "Întrerupătorul A" in c.text:
        c.find_element(By.TAG_NAME, "label").click(); pauza(1.2); break
poza("porti_pc", element=MAIN)
poza("porti_tel", LAT_TEL)
tab("if în Python")
for c in d.find_elements(By.CSS_SELECTOR, '[data-testid="stMain"] [data-testid="stCheckbox"]'):
    if "utilizator_logat" in c.text and c.is_displayed():
        c.find_element(By.TAG_NAME, "label").click(); pauza(1.2); break
poza("if_pc", element=MAIN)
tab("Parole")
scrie("parolă de probă", "logica2026")
poza("parole_pc", element=MAIN)
tab("SQL")
poza("sql_pc", element=MAIN)
tab("XOR")
poza("xor_pc", element=MAIN)
tab("Sistem expert")
vizibile = [g for g in grupuri_radio() if g.is_displayed()]
alege(vizibile[0], "Da"); alege(vizibile[1], "Nu")
poza("expert_pc", element=MAIN)

print("Teste pe niveluri")
mergi("Teste pe niveluri")
poza("teste_alegere_pc", element=MAIN)
buton("Începe testul de Nivel 2")
nivel2 = [q for q in INTREBARI if q["nivel"] == 2]


def curata_md(t):
    return t.replace("`", "").replace("**", "")


for pas in range(10):
    text = d.find_element(By.CSS_SELECTOR, '[data-testid="stMain"]').text
    # mai multe întrebări pot începe la fel; o păstrăm pe cea ale cărei variante sunt pe ecran
    variante_ecran = set(l.text.strip() for l in grupuri_radio()[-1].find_elements(By.CSS_SELECTOR, 'label[data-testid="stRadioOption"]'))
    candidati = [c for c in nivel2 if curata_md(c["enunt"]).split("\n")[0][:75] in text]
    if len(candidati) > 1:
        candidati = [c for c in candidati if set(curata_md(v) for v in c["variante"]) == variante_ecran]
    q = candidati[0] if candidati else None
    assert q, "nu recunosc întrebarea: " + text[:200]
    gresit = [v for v in q["variante"] if v != q["raspuns_corect"]][0]
    raspuns = gresit if pas in (1, 4, 7) else q["raspuns_corect"]  # 7 din 10 corecte
    alege(grupuri_radio()[-1], raspuns)
    if pas == 0:
        poza("test_intrebare_pc", element=MAIN)
    buton("Verifică")
    if pas == 0:
        poza("test_corect_pc", element=MAIN)
        poza("test_corect_tel", LAT_TEL)
    if pas == 1:
        poza("test_gresit_pc", element=MAIN)
    buton("Următoarea" if pas < 9 else "Vezi rezultatul")

poza("test_rezultat_pc", element=MAIN)
poza("test_rezultat_tel", LAT_TEL)

print("Despre")
mergi("Despre")
poza("despre_pc", element=MAIN, max_h=1500)
d.quit()
print("gata")
