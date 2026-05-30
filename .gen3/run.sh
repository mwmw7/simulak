#!/usr/bin/env bash
# 4 brand-new Korean faces for the targeting console (Z Image, cheap, parallel).
set -uo pipefail
cd /home/branden/simula_entertainment
mkdir -p .gen3

gen() {
  local name="$1" prompt="$2"
  higgsfield generate create z_image --prompt "$prompt" --aspect_ratio 4:3 \
    --wait --wait-timeout 15m --json > ".gen3/$name.json" 2> ".gen3/$name.err"
  echo "[done] $name exit=$?"
}

gen ad-m30 "Photorealistic portrait of a confident Korean man in his early 30s, refined modern professional, warm approachable slight smile, sophisticated grooming, dark studio background, premium soft lighting, no text" &
gen ad-mil "Photorealistic portrait of a stylish Korean millennial woman around 30, cosmopolitan editorial look, calm confident expression, elegant minimal styling, dark background, soft cinematic light, no text" &
gen ad-z "Photorealistic portrait of an edgy young Korean man in his late teens, bold streetwear, cool confident vibe, tousled hair, dark background, subtle neon-tinged rim light, no text" &

wait
echo "ALL_AD_FACES_DONE"
higgsfield account status 2>&1 | head -1
