#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "File .env belum ada. Salin dari .env.example lalu isi semua nilainya."
  exit 1
fi

echo "[1/3] Menarik kode terbaru dari GitHub..."
git pull --ff-only origin main

echo "[2/3] Membangun dan menjalankan container..."
docker compose up -d --build

echo "[3/3] Membersihkan image Smartify yang lama..."
docker image prune -f --filter "label=app=smartify"

echo "Selesai. Smartify berjalan di 127.0.0.1:3060"
