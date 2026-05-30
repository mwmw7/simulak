#!/usr/bin/env bash
set -uo pipefail
cd /home/branden/simula_entertainment
F=/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc

# text via files (unicode/space safe)
printf 'SIMULA ENTERTAINMENT'            > /tmp/og1.txt
printf '완벽한 환영'                      > /tmp/og2.txt
printf '사람 없는 완벽함 · AI 엔터테인먼트' > /tmp/og3.txt

# 1) bottom-weighted dark gradient scrim (transparent -> dark)
ffmpeg -y -loglevel error -f lavfi \
  -i "gradients=s=1200x630:c0=0x00000000:c1=0x000000E0:x0=600:y0=40:x1=600:y1=630" \
  -frames:v 1 /tmp/og_grad.png || { echo "gradient FAILED"; exit 1; }

# 2) compose: hero (cover-crop) + scrim + text
ffmpeg -y -loglevel error -i assets-src/hero.png -i /tmp/og_grad.png -filter_complex \
"[0:v]scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630,eq=brightness=-0.02:saturation=1.08[bg];[bg][1:v]overlay=0:0[base];[base]drawtext=fontfile=${F}:textfile=/tmp/og1.txt:fontcolor=0xF1C40F:fontsize=30:x=72:y=360:shadowcolor=black@0.6:shadowx=2:shadowy=2,drawtext=fontfile=${F}:textfile=/tmp/og2.txt:fontcolor=white:fontsize=98:x=68:y=400:shadowcolor=black@0.8:shadowx=3:shadowy=3,drawtext=fontfile=${F}:textfile=/tmp/og3.txt:fontcolor=0xEAEAEA:fontsize=32:x=72:y=526:shadowcolor=black@0.8:shadowx=2:shadowy=2[out]" \
  -map "[out]" -frames:v 1 public/assets/og-image.png || { echo "compose FAILED"; exit 1; }

# jpg variant (smaller, broad compatibility)
ffmpeg -y -loglevel error -i public/assets/og-image.png -q:v 3 public/assets/og-image.jpg

echo "OG_OK"
ls -lh public/assets/og-image.png public/assets/og-image.jpg
