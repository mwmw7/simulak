#!/usr/bin/env bash
# Retry failed Seedance clips SEQUENTIALLY (avoids parallel upload contention).
set -uo pipefail
cd /home/branden/simula_entertainment

gen() {
  local name="$1" prompt="$2"
  echo "[start] $name"
  higgsfield generate create seedance_2_0 \
    --prompt "$prompt" \
    --start-image "assets-src/$name.png" \
    --aspect_ratio 3:4 --duration 5 --resolution 480p --mode fast --genre drama \
    --wait --wait-timeout 20m --json \
    > ".genv/$name.json" 2> ".genv/$name.err"
  echo "[done ] $name exit=$?"
}

gen actor-aria "Subtle cinematic motion: she breathes gently, a slight graceful head turn and soft blink, hair catches a faint breeze, violet and amber rim light shimmers, photoreal high-fashion editorial, minimal elegant movement, fixed framing"
gen actor-nova "Subtle cinematic motion: a slow ethereal head turn and gentle blink, avant-garde poise, faint particles drift, neon violet and yellow shimmer, high fashion editorial, minimal movement, fixed framing"
gen artist-echo "Subtle cinematic motion: the virtual pop star sways slightly to a beat, holographic microphone glows and pulses, stage haze drifts, neon violet and amber lights flicker, dynamic concert energy, photoreal, fixed framing"
gen artist-lumen "Subtle cinematic motion: ethereal music artist breathes calmly, iridescent light particles float and drift, gentle glow pulse, dreamy album-cover aesthetic, minimal movement, fixed framing"

echo "RETRY_DONE"
higgsfield account status 2>&1 | head -1
