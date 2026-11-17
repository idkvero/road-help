#!/bin/sh
ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${TMPDIR:-/tmp}/road-help-logs"
mkdir -p "$LOG_DIR"

check_url() {
  code="$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$1")"
  [ "$code" != "000" ]
}

wait_url() {
  url="$1"
  limit="$2"
  i=0

  while [ "$i" -lt "$limit" ]; do
    if check_url "$url"; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done

  return 1
}

start() {
  name="$1"
  dir="$2"
  cmd="$3"
  url="$4"
  limit="${5:-60}"

  if check_url "$url"; then
    echo "• $name уже работает ($url)"
    return 0
  fi

  ( cd "$dir" && nohup sh -c "$cmd" > "$LOG_DIR/$name.log" 2>&1 & )

  if wait_url "$url" "$limit"; then
    echo "• $name запущен ($url)"
  else
    echo "• $name НЕ запустился за ${limit}с — смотри лог: $LOG_DIR/$name.log"
  fi
}

if [ -x "$HOME/mongodb-install/start-mongo.sh" ]; then
  "$HOME/mongodb-install/start-mongo.sh"
fi

start "rest-api" "$ROOT" "node server.js" "http://localhost:3000/requests" 90
start "mongo-api" "$ROOT/server-mongo" "node server.js" "http://localhost:3001/requests" 90
start "realtime" "$ROOT/server-socket" "node server.js" "http://localhost:3002/health" 90
start "client" "$ROOT/client" "npm run dev" "http://localhost:5173" 150

echo ""
echo "Адреса:"
echo "  Клиент:     http://localhost:5173"
echo "  REST API:   http://localhost:3000/requests"
echo "  Mongo API:  http://localhost:3001/requests"
echo "  Realtime:   http://localhost:3002/health"
echo ""
echo "Остановить всё: ./stop-all.sh"
