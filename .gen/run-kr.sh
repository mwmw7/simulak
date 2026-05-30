#!/usr/bin/env bash
# Regenerate Korean-style characters via GPT Image 2 (1k/medium, parallel).
set -uo pipefail
cd /home/branden/simula_entertainment
mkdir -p .gen2

gen() {
  local name="$1" ar="$2" prompt="$3"
  echo "[start] $name"
  higgsfield generate create gpt_image_2 \
    --prompt "$prompt" \
    --aspect_ratio "$ar" --resolution 1k --quality medium \
    --wait --wait-timeout 20m --json \
    > ".gen2/$name.json" 2> ".gen2/$name.err"
  echo "[done ] $name exit=$?"
}

gen hero "16:9" "Ultra-photorealistic cinematic portrait of a flawless young Korean synthetic human emerging from deep shadow, half the face lit by a thin rim of violet and amber light, hyperreal perfect Korean skin with a subtle synthetic sheen, dark charcoal background, volumetric haze, premium futuristic K-beauty editorial, shallow depth of field, 85mm, dramatic chiaroscuro, no text" &

gen actor-aria "3:4" "Ultra-photorealistic editorial portrait of a strikingly beautiful Korean synthetic actress in her mid 20s, flawless luminous K-beauty skin, confident direct gaze, high fashion magazine cover styling, dark studio background, violet and amber accent lighting, premium cinematic, no text" &

gen actor-kai "3:4" "Ultra-photorealistic editorial portrait of a handsome young Korean synthetic male actor, sharp jawline, K-pop idol visuals, intense quiet expression, sleek modern minimal styling, dark studio backdrop with subtle purple and gold rim light, premium cinematic fashion photography, no text" &

gen actor-nova "3:4" "Ultra-photorealistic high-fashion portrait of an androgynous Korean synthetic supermodel, ethereal flawless features, avant-garde K-fashion styling, dark background, neon violet and yellow accent light, futuristic premium editorial, no text" &

gen artist-echo "3:4" "Ultra-photorealistic portrait of a futuristic Korean virtual K-pop star mid-performance, glowing holographic microphone, neon violet and amber stage light, dark moody atmosphere, shimmering skin, dynamic concert energy, premium music editorial, no text" &

gen artist-lumen "3:4" "Ultra-photorealistic portrait of an ethereal Korean virtual music artist, iridescent K-beauty makeup, floating glowing light particles, dark background, purple and gold neon glow, cinematic album-cover aesthetic, premium, no text" &

wait
echo "ALL_KR_IMAGES_DONE"
higgsfield account status 2>&1 | head -1
