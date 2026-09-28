# Publicarea LogicLab pe o mașină virtuală (Ubuntu + nginx)

Varianta temporară, până la publicarea pe Streamlit Community Cloud.

```
Internet → nginx (porturile 80/443) → LogicLab (Streamlit, 127.0.0.1:8502)
```

## 1. Copiază proiectul pe mașina virtuală (de pe calculatorul tău)

```bash
rsync -av --exclude ".venv" --exclude "__pycache__" --exclude ".pytest_cache" \
      logiclab/ UTILIZATOR@IP_VM:/tmp/logiclab/
```

## 2. Instalare (o singură dată, pe mașina virtuală)

```bash
# Python 3.10+ și modulul venv
python3 --version
sudo apt update && sudo apt install -y python3-venv rsync

# Verifică dacă portul 8502 e liber (nu trebuie să afișeze nimic)
sudo ss -ltnp | grep 8502

# Un utilizator separat, fără drepturi de administrator, pentru aplicație
sudo useradd --system --home /opt/logiclab --shell /usr/sbin/nologin logiclab

# Fișierele și mediul virtual
sudo mkdir -p /opt/logiclab
sudo rsync -a /tmp/logiclab/ /opt/logiclab/
sudo chown -R logiclab:logiclab /opt/logiclab
sudo -u logiclab python3 -m venv /opt/logiclab/.venv
sudo -u logiclab /opt/logiclab/.venv/bin/pip install -r /opt/logiclab/requirements.txt

# Serviciul care ține aplicația pornită
sudo cp /opt/logiclab/deploy/logiclab.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now logiclab
curl -s http://127.0.0.1:8502/_stcore/health     # trebuie să afișeze: ok
```

## 3. nginx

**Varianta A – subdomeniu** (de ex. `logiclab.domeniul-tau.ro`):

1. La furnizorul domeniului, adaugă o înregistrare DNS de tip **A**: `logiclab` → IP-ul public al mașinii virtuale.
2. Pune subdomeniul tău în `deploy/nginx-logiclab.conf` (la `server_name`), apoi:

```bash
sudo cp /opt/logiclab/deploy/nginx-logiclab.conf /etc/nginx/sites-available/logiclab
sudo ln -s /etc/nginx/sites-available/logiclab /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Varianta B – subfolder** (de ex. `https://site-existent.ro/logiclab/`): urmează comentariile de la finalul fișierului `deploy/nginx-logiclab.conf`.

> `nginx -t` verifică toată configurarea înainte de reîncărcare. Dacă dă eroare, nu rula `reload`, ca să nu afectezi celelalte site-uri.

## 4. HTTPS (recomandat)

```bash
sudo certbot --nginx -d logiclab.domeniul-tau.ro
```

## 5. Actualizări ulterioare

Copiază din nou fișierele (pasul 1), apoi rulează pe mașina virtuală:

```bash
sudo bash /tmp/logiclab/deploy/actualizeaza.sh
```

## Dacă ceva nu merge

| Problemă | Ce verifici |
|---|---|
| Pagina rămâne la „Connecting…” | Liniile `Upgrade` / `Connection` din configurarea nginx (WebSocket) |
| 502 Bad Gateway | `sudo systemctl status logiclab` și `sudo journalctl -u logiclab -n 50` |
| Site-ul nu se deschide deloc | DNS-ul subdomeniului și regulile Azure (Network Security Group) pentru porturile 80/443 |
