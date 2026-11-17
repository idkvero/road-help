#!/bin/sh
for pid in $(pgrep -f "road-help/server.js" 2>/dev/null) \
           $(pgrep -f "road-help/server-mongo/server.js" 2>/dev/null) \
           $(pgrep -f "road-help/server-socket/server.js" 2>/dev/null) \
           $(pgrep -f "road-help/client/node_modules/.bin/vite" 2>/dev/null) \
           $(pgrep -f "road-help/client.*vite" 2>/dev/null); do
  kill "$pid" 2>/dev/null
done

for pid in $(lsof -ti :3000 2>/dev/null) $(lsof -ti :3001 2>/dev/null) $(lsof -ti :3002 2>/dev/null) $(lsof -ti :5173 2>/dev/null); do
  kill "$pid" 2>/dev/null
done

echo "• сервисы остановлены"

if [ -x "$HOME/mongodb-install/stop-mongo.sh" ]; then
  "$HOME/mongodb-install/stop-mongo.sh"
fi

echo "Готово."
