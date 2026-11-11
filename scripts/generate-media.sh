#!/usr/bin/env bash
#
# generate-media.sh — creates placeholder demo videos + posters under public/media/.
# Every clip is a locally generated animation with a label showing its path;
# replace the files (keeping names) to drop in real results.
#
# Requires: ffmpeg (brew install ffmpeg) and node (for bev.json).
#
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="public/media"
FONT="/System/Library/Fonts/Helvetica.ttc"

# Find an ffmpeg that has the drawtext filter (ffmpeg-full on macOS;
# regular Homebrew ffmpeg is built without freetype).
FFMPEG=""
for candidate in "$(command -v ffmpeg || true)" /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg /usr/local/opt/ffmpeg-full/bin/ffmpeg; do
  [ -n "$candidate" ] || continue
  [ -x "$candidate" ] || continue
  # NB: plain grep (not -q) so ffmpeg is not SIGPIPE'd mid-list under pipefail.
  if "$candidate" -hide_banner -filters 2>/dev/null | grep drawtext >/dev/null; then
    FFMPEG="$candidate"
    break
  fi
done
if [ -z "$FFMPEG" ]; then
  echo "No ffmpeg with drawtext found — 'brew install ffmpeg-full' first." >&2
  exit 1
fi

# clip <relpath> <w> <h> <dur> <bg1> <bg2> <label-text> [extra comma-joined filters]
clip() {
  local out="$1" w="$2" h="$3" dur="$4" c1="$5" c2="$6" text="$7" extra="${8:-}"
  mkdir -p "$(dirname "$ROOT/$out")"
  local f="gradients=s=${w}x${h}:c0=${c1}:c1=${c2}:speed=0.03:nb_colors=2,format=yuv420p"
  f="$f,drawtext=fontfile=${FONT}:text='${text}':x=24:y=24:fontsize=22:fontcolor=white@0.92:box=1:boxcolor=black@0.45:boxborderw=10"
  if [ -n "$extra" ]; then f="$f,$extra"; fi
  "$FFMPEG" -y -loglevel error -f lavfi -i "$f" \
    -t "$dur" -r 24 -c:v libx264 -preset veryfast -crf 30 -pix_fmt yuv420p -movflags +faststart \
    "$ROOT/$out"
  echo "  ✓ $out"
}

poster() { # videopath -> jpg still
  local v="$1"
  "$FFMPEG" -y -loglevel error -ss 2 -i "$v" -frames:v 1 -q:v 4 "${v%.mp4}.jpg"
  echo "  ✓ $(basename "${v%.mp4}.jpg")"
}

echo "landing…"
# The synchronized source is a "control room" layout: each of the seven crop
# regions gets its own labeled, animated panel so every landing tile is visibly
# distinct. Region map (1280x720): main [120,0,640,720]; a/b/c [760,0|210|420,400,300];
# d/e [0,0|360,200,360]; f/g [120|420,700,300,100].
mkdir -p "$ROOT/landing"
"$FFMPEG" -y -loglevel error -f lavfi -i "gradients=s=1280x720:c0=0x0d1b29:c1=0x123043:speed=0.02:nb_colors=2,format=yuv420p" \
  -vf "drawbox=x=120:y=0:w=640:h=720:color=0x1c4f7c@0.9:t=fill,\
drawbox=x=760:y=0:w=400:h=300:color=0x2f6b62@0.9:t=fill,\
drawbox=x=760:y=210:w=400:h=300:color=0x8a6c1f@0.9:t=fill,\
drawbox=x=760:y=420:w=400:h=300:color=0x6a3b8c@0.9:t=fill,\
drawbox=x=0:y=0:w=200:h=360:color=0x1f6f8c@0.9:t=fill,\
drawbox=x=0:y=360:w=200:h=360:color=0x8c4a2f@0.9:t=fill,\
drawbox=x=120:y=700:w=300:h=20:color=0xffffff@0.85:t=fill,\
drawbox=x=420:y=700:w=300:h=20:color=0xffffff@0.85:t=fill,\
drawtext=fontfile=${FONT}:text='VIEW 1 · MAIN':fontsize=34:fontcolor=white:x=330:y=330,\
drawtext=fontfile=${FONT}:text='VIEW 2':fontsize=28:fontcolor=white:x=900:y=130,\
drawtext=fontfile=${FONT}:text='VIEW 3':fontsize=28:fontcolor=white:x=900:y=340,\
drawtext=fontfile=${FONT}:text='VIEW 4':fontsize=28:fontcolor=white:x=900:y=550,\
drawtext=fontfile=${FONT}:text='V5':fontsize=22:fontcolor=white:x=80:y=160,\
drawtext=fontfile=${FONT}:text='V6':fontsize=22:fontcolor=white:x=80:y=520,\
drawtext=fontfile=${FONT}:text='SYNCHRONIZED SOURCE · PLACEHOLDER':fontsize=18:fontcolor=white@0.8:x=340:y=668,\
drawbox=x=200+100*sin(2*PI*t/6):y=560:w=90:h=54:color=white@0.25:t=fill,\
drawbox=x=560+80*cos(2*PI*t/5):y=470:w=64:h=40:color=white@0.18:t=fill" \
  -t 8 -r 24 -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -movflags +faststart \
  "$ROOT/landing/synchronized.mp4"
echo "  ✓ landing/synchronized.mp4"

for i in 1 2 3 4 5 6 7; do
  "$FFMPEG" -y -loglevel error -ss 2 -i "$ROOT/landing/synchronized.mp4" -frames:v 1 -q:v 4 "$ROOT/landing/view-0$i.jpg"
done
echo "  ✓ landing/view-01..07.jpg"

clip "landing/opening.mp4" 1280 720 8 0x0d1b29 0x274a63 "OPENING CLIP"

echo "control…"
clip "control/lane.mp4" 960 540 6 0x122a3d 0x1d4a66 "CONTROL · LANE CHANGE" \
  "drawbox=x=300+200*t*0.5:y=610:w=180:h=14:color=white@0.6:t=fill,drawbox=x=300+200*t*0.5:y=640:w=180:h=14:color=white@0.35:t=fill"
clip "control/road_marker.mp4" 960 540 6 0x122a3d 0x3d3d1d "CONTROL · ROAD MARKERS" \
  "drawbox=x=0:y='660-560*mod(t,2)':w=960:h=6:color=0xe8d44d@0.7:t=fill"
clip "control/traffic_light.mp4" 960 540 6 0x101c26 0x24303a "CONTROL · TRAFFIC LIGHT" \
  "drawbox=x=430:y=180:w=100:h=260:color=0x1a1a1a@0.9:t=fill,drawbox=x=450:y=200:w=60:h=60:color=red@1:t=fill:enable='lt(mod(t,3),1)',drawbox=x=450:y=280:w=60:h=60:color=0xe8d44d@1:t=fill:enable='gte(mod(t,3),1)*lt(mod(t,3),2)',drawbox=x=450:y=360:w=60:h=60:color=0x3fd97c@1:t=fill:enable='gte(mod(t,3),2)'"
poster "$ROOT/control/lane.mp4"
poster "$ROOT/control/road_marker.mp4"
poster "$ROOT/control/traffic_light.mp4"

echo "grounding / 3dgs…"
clip "grounding/3dgs/demo-01.mp4" 960 540 6 0x2f6b62 0x143b35 "3DGS · RECONSTRUCTION"
clip "grounding/3dgs/demo-02.mp4" 960 540 6 0x2f6b62 0x0d332d "3DGS · GENERATED A"
clip "grounding/3dgs/demo-04.mp4" 960 540 6 0x2f6b62 0x1c4a42 "3DGS · GENERATED B"

echo "G-scenes (condition vs generated × 7 cams)…"
for scene in G150 G293 G387; do
  for cam in 0 2 3 4 5 6 7; do
    clip "$scene/condition_cam$cam.mp4" 640 360 3 0x223a4d 0x1d5a52 "$scene · CAM $cam · CONDITION"
    clip "$scene/generated_cam$cam.mp4" 640 360 3 0x243b33 0x1f5d6e "$scene · CAM $cam · GENERATED"
  done
done

echo "long-horizon sf/csf…"
for v in V058 V121 V126; do
  # sf: the marker drifts sideways over time; csf: it stays centred
  clip "$v-sf.mp4" 640 360 8 0x1d2340 0x0e2a1e "SF · DRIFTS" \
    "drawbox=x=280+90*t:y=150+40*sin(t):w=60:h=44:color=white@0.5:t=fill"
  clip "$v-csf.mp4" 640 360 8 0x10241c 0x14352c "CSF · STABLE" \
    "drawbox=x=280+6*sin(t):y=150:w=60:h=44:color=white@0.5:t=fill"
done

echo "interaction / closed-loop…"
clip "interaction/avoidance.mp4" 960 540 6 0x101e26 0x14313d "EPISODE · INTERACTION AVOIDANCE" \
  "drawbox=x=140:y=330:w=110:h=190:color=0x58d5c0@0.85:t=fill,drawbox=x='520-160*min(1,max(0,(t-1.2)/1.6))':y=330:w=110:h=190:color=0xffb66b@0.85:t=fill,drawbox=x=700:y=290:w=90:h=150:color=0x9fb4c4@0.7:t=fill"
poster "$ROOT/interaction/avoidance.mp4"

echo "dashcam…"
clip "dashcam/sample_3_3_pred_rank3.mp4" 960 540 8 0x14202b 0x2a3a47 "DASHCAM · PRED RANK 3 · PLACEHOLDER" \
  "drawbox=x=330:y=200:w=300:h=230:color=0xffffff@0.14:t=fill,drawbox=x=470:y=300:w=24:h=70:color=0x3fd97c@0.8:t=fill,drawbox=x=0:y=0:w=960:h=6:color=0x3fd97c@0.8:t=fill"
poster "$ROOT/dashcam/sample_3_3_pred_rank3.mp4"

echo "bev.json…"
node scripts/gen-bev.mjs

echo
echo "done — $(find "$ROOT" -type f | wc -l | tr -d ' ') files under $ROOT"
