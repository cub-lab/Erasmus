"""Prelucrează capturile brute (PNG) pentru manualul Word.

Rulare:  python docs/generare/prelucreaza.py <folder_capturi_png>
Rezultat: imaginile JPEG din docs/generare/gata/ și dimensiuni.json (folosite de genereaza.js).
"""
import glob, json, os, sys
from PIL import Image, ImageChops

SURSA = sys.argv[1]
AICI = os.path.dirname(os.path.abspath(__file__))
GATA = os.path.join(AICI, "gata")
os.makedirs(GATA, exist_ok=True)

for f in sorted(glob.glob(os.path.join(SURSA, "*.png"))):
    im = Image.open(f).convert("RGB")
    # tăiem marginile albe de sus și de jos
    fundal = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im, fundal).convert("L").point(lambda v: 255 if v > 12 else 0)
    box = diff.getbbox()
    if box:
        im = im.crop((0, max(0, box[1] - 36), im.width, min(im.height, box[3] + 36)))
    telefon = f.endswith("_tel.png")
    maxw = 820 if telefon else 1500
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    if telefon:  # proporția unui ecran de telefon (19,5 : 9)
        h = round(im.width * 19.5 / 9)
        if im.height > h:
            im = im.crop((0, 0, im.width, h))
    im.save(os.path.join(GATA, os.path.basename(f)[:-4] + ".jpg"), "JPEG", quality=86, optimize=True)

# pagina lungă de rezultat: două bucăți, tăiate la un rând alb
cale = os.path.join(GATA, "test_rezultat_pc.jpg")
if os.path.exists(cale):
    full = Image.open(cale)
    gri = full.convert("L")
    y = min(2150, full.height // 2)
    while y < full.height - 400 and not all(gri.getpixel((x, y)) > 245 for x in range(0, full.width, 8)):
        y += 2
    full.crop((0, 0, full.width, y)).save(os.path.join(GATA, "test_rezultat_a_pc.jpg"), "JPEG", quality=86)
    full.crop((0, y, full.width, full.height)).save(os.path.join(GATA, "test_rezultat_b_pc.jpg"), "JPEG", quality=86)

dim = {os.path.basename(f)[:-4]: Image.open(f).size for f in glob.glob(os.path.join(GATA, "*.jpg"))}
json.dump(dim, open(os.path.join(AICI, "dimensiuni.json"), "w"), indent=0)
print(len(dim), "imagini pregătite în", GATA)
