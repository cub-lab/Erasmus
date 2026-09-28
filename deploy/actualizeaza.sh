#!/bin/bash
# Actualizează LogicLab pe mașina virtuală după ce ai copiat fișierele noi în /tmp/logiclab.
# Rulare (pe mașina virtuală):  sudo bash /tmp/logiclab/deploy/actualizeaza.sh
set -e

# Copiem fișierele noi peste cele vechi (fără mediul virtual, care rămâne pe server).
rsync -a --delete --exclude ".venv" /tmp/logiclab/ /opt/logiclab/
chown -R logiclab:logiclab /opt/logiclab

# Instalăm bibliotecile (doar dacă s-a schimbat requirements.txt, altfel e rapid).
sudo -u logiclab /opt/logiclab/.venv/bin/pip install -q -r /opt/logiclab/requirements.txt

# Verificăm că testele trec înainte să repornim aplicația.
cd /opt/logiclab && sudo -u logiclab .venv/bin/python -m pytest -q -p no:cacheprovider

systemctl restart logiclab
echo "LogicLab a fost actualizat și repornit."
