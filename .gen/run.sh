#!/usr/bin/env bash
# Generate Simulacra Entertainment assets via Higgsfield GPT Image 2 (parallel).
set -uo pipefail
cd /home/branden/simula_entertainment
mkdir -p public/assets/generated .gen

gen() {
  local name="$1" ar="$2" prompt="$3"
  echo "[start] $name ($ar)"
  higgsfield generate create gpt_image_2 \
    --prompt "$prompt" \
    --aspect_ratio "$ar" \
    --resolution 2k \
    --wait --wait-timeout 20m --json \
    > ".gen/$name.json" 2> ".gen/$name.err"
  echo "[done ] $name exit=$?"
}

gen hero "16:9" "Ultra-photorealistic cinematic portrait of a flawless synthetic human emerging from deep shadow, half the face lit by a thin rim of violet and amber light, hyperreal perfect skin with a subtle uncanny synthetic sheen, dark charcoal background, volumetric haze, premium futuristic editorial, shallow depth of field, 85mm, dramatic chiaroscuro, no text" &

gen actor-aria "3:4" "Ultra-photorealistic editorial portrait of a strikingly beautiful synthetic actress in her late 20s, flawless luminous skin, confident direct gaze, high fashion magazine cover styling, dark studio background, violet and amber accent lighting, premium cinematic, shallow depth of field, no text" &

gen actor-kai "3:4" "Ultra-photorealistic editorial portrait of a handsome synthetic male actor, sharp jawline, intense quiet expression, sleek modern minimal styling, dark studio backdrop with subtle purple and gold rim light, premium cinematic fashion photography, no text" &

gen actor-nova "3:4" "Ultra-photorealistic high-fashion portrait of an androgynous synthetic supermodel, ethereal flawless features, avant-garde styling, dark background, neon violet and yellow accent light, futuristic premium editorial, no text" &

gen artist-echo "3:4" "Ultra-photorealistic portrait of a futuristic virtual pop star mid-performance, glowing holographic microphone, neon violet and amber stage light, dark moody atmosphere, shimmering skin, dynamic concert energy, premium music editorial, no text" &

gen artist-lumen "3:4" "Ultra-photorealistic portrait of an ethereal virtual music artist, iridescent makeup, floating glowing light particles, dark background, purple and gold neon glow, cinematic album-cover aesthetic, premium, no text" &

wait
echo "ALL_GENERATION_DONE"
