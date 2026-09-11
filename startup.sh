#!/bin/sh
# Restart contract: bring the preview back on 0.0.0.0:8080 via npm run dev.
set -eu
cd /workspace

export AI_PROVIDER="${AI_PROVIDER:-groq}"

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi

npm run dev > /tmp/apexstudy-dev.log 2>&1 &

i=0
while [ "$i" -lt 60 ]; do
  if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
    exit 0
  fi
  i=$((i + 1))
  sleep 0.5
done

echo "ApexStudy dev server did not become ready on :8080" >&2
tail -n 80 /tmp/apexstudy-dev.log >&2 || true
exit 1
