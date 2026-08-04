#!/usr/bin/env bash
# TITAN OMEGA — assemble PNG sequences + mixed audio into delivery masters
set -euo pipefail
FF=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
OUT=/home/user/titan-omega-film/out
DEL=/home/user/titan-omega-film/deliverables
mkdir -p "$DEL"

enc () {   # enc <name> <framesdir> <audio> <outfile>
  local name=$1 frames=$2 audio=$3 out=$4
  echo "── encoding $name"
  "$FF" -y -hide_banner -loglevel error \
    -framerate 24 -i "$frames/f%05d.png" \
    -i "$audio" \
    -map 0:v -map 1:a \
    -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
    -x264-params "keyint=48:min-keyint=24:bframes=3:ref=4" \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a aac -b:a 320k -ar 48000 -ac 2 \
    -movflags +faststart -shortest \
    "$out"
  echo "   $(du -h "$out" | cut -f1)  $out"
}

enc "60s master (2.39:1)"  "$OUT/frames_master" "$OUT/audio_master.wav" "$DEL/TitanOmega_60s_2K.mp4"
enc "30s cut (2.39:1)"     "$OUT/frames_cut30"  "$OUT/audio_cut30.wav"  "$DEL/TitanOmega_30s_2K.mp4"
enc "15s vertical (9:16)"  "$OUT/frames_cut15"  "$OUT/audio_cut15.wav"  "$DEL/TitanOmega_15s_Vertical.mp4"

echo "── poster frames"
for t in 17.2 44.5 54.5; do
  "$FF" -y -hide_banner -loglevel error -i "$DEL/TitanOmega_60s_2K.mp4" -ss $t -frames:v 1 -q:v 2 "$DEL/still_${t/./_}s.jpg"
done
echo "done"
