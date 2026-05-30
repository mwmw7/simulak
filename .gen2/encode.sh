#!/usr/bin/env bash
# Download + web-optimize Korean Seedance results into public/assets/video/
set -uo pipefail
cd /home/branden/simula_entertainment
mkdir -p public/assets/video assets-src/video

for name in hero actor-aria actor-kai actor-nova artist-echo artist-lumen; do
  f=".gen2/vid/$name.json"
  [ -f "$f" ] || { echo "✗ $name: no json"; continue; }
  url=$(jq -r '(if type=="array" then .[0] else . end) | (.url.result_url // .result_url // .url)' "$f")
  if [ -z "$url" ] || [ "$url" = "null" ]; then echo "✗ $name: no url (job not completed)"; continue; fi
  curl -fsSL "$url" -o "assets-src/video/$name-src.mp4" || { echo "✗ $name download"; continue; }
  ffmpeg -y -loglevel error -i "assets-src/video/$name-src.mp4" -an \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset veryfast -movflags +faststart \
    "public/assets/video/$name.mp4" \
    && echo "✓ $name.mp4 ($(du -h public/assets/video/$name.mp4 | cut -f1))" \
    || echo "✗ $name encode"
done
echo "--- video dir ---"; ls -lh public/assets/video/
