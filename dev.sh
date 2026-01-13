#!/bin/bash

# créer venv si inexistant
if [ ! -d "venv" ]; then
    echo "Création du virtual environment..."
    python3 -m venv venv
fi

# activer le venv
source venv/bin/activate

# fonction pour installer un package seulement s'il n'est pas présent
install_if_missing() {
    package=$1
    if ! pip show "$package" > /dev/null 2>&1; then
        echo "Installation de $package..."
        pip install "$package"
    else
        echo "$package déjà installé, skipping..."
    fi
}

# vérifier et installer les dépendances si nécessaire
install_if_missing torch
install_if_missing transformers
install_if_missing fastapi
install_if_missing uvicorn

# aller dans le dossier où se trouve gemma_server.py
cd src/CoachServer || exit

# lancer Gemma en arrière-plan
uvicorn gemma_server:app --reload --port 8000 &

# revenir à la racine du projet pour lancer Tauri
cd ../../

# lancer Tauri
# pnpm start-vite
pnpm tauri dev
