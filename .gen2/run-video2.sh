#!/usr/bin/env bash
# Animate Korean characters via Seedance 2.0 from local image files.
# SEQUENTIAL + single retry (avoids the parallel-upload contention seen earlier).
set -uo pipefail
cd /home/branden/simula_entertainment
mkdir -p .gen2/vid

gen() {
  local name="$1" ar="$2" res="$3" prompt="$4" attempt
  for attempt in 1 2; do
    echo "[try $attempt] $name"
    higgsfield generate create seedance_2_0 \
      --prompt "$prompt" \
      --start-image "assets-src/$name.png" \
      --aspect_ratio "$ar" --duration 5 --resolution "$res" --mode fast --genre drama \
      --wait --wait-timeout 20m --json \
      > ".gen2/vid/$name.json" 2> ".gen2/vid/$name.err"
    if [ $? -eq 0 ] && jq -e '(if type=="array" then .[0] else . end) | (.url.status // .status) == "completed"' ".gen2/vid/$name.json" >/dev/null 2>&1; then
      echo "[ok ] $name"; return 0
    fi
    echo "[fail $attempt] $name: $(tail -1 .gen2/vid/$name.err | cut -c1-80)"
    sleep 3
  done
  echo "[GAVE UP] $name"
}

gen hero "16:9" "720p" "Subtle cinematic motion: the synthetic human breathes softly and blinks once, faint volumetric haze drifts, very slow gentle push-in, violet and amber rim light shimmers, photoreal, minimal elegant movement, premium, fixed framing"
gen actor-aria "3:4" "480p" "Subtle cinematic motion: she breathes gently, a slight graceful head turn and soft blink, hair catches a faint breeze, violet and amber rim light shimmers, photoreal high-fashion editorial, minimal elegant movement, fixed framing"
gen actor-kai "3:4" "480p" "Subtle cinematic motion: he breathes, a slow intense gaze shift and faint blink, subtle rim light flicker, photoreal cinematic editorial, minimal premium movement, fixed framing"
gen actor-nova "3:4" "480p" "Subtle cinematic motion: a slow ethereal head turn and gentle blink, avant-garde poise, faint particles drift, neon violet and yellow shimmer, high fashion editorial, minimal movement, fixed framing"
gen artist-echo "3:4" "480p" "Subtle cinematic motion: the virtual pop star sways slightly to a beat, holographic microphone glows and pulses, stage haze drifts, neon violet and amber lights flicker, dynamic concert energy, photoreal, fixed framing"
gen artist-lumen "3:4" "480p" "Subtle cinematic motion: ethereal music artist breathes calmly, iridescent light particles float and drift, gentle glow pulse, dreamy album-cover aesthetic, minimal movement, fixed framing"

echo "ALL_KR_VIDEO2_DONE"
higgsfield account status 2>&1 | head -1
