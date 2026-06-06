#!/usr/bin/env bash
#
# Установка и настройка FreeQwenApi как автономного сервиса под PM2.
# Запускается из любой папки, куда склонирован репозиторий:
#
#   npm run setup
#   # или напрямую:
#   bash scripts/setup.sh
#
set -euo pipefail

# Корень репозитория = родительская папка этого скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_DIR}"

echo "==> Репозиторий: ${REPO_DIR}"

# 1. Проверка Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "ОШИБКА: Node.js не найден. Установите Node.js 18+ и повторите." >&2
  exit 1
fi
echo "==> Node.js: $(node --version)"

# 2. Установка зависимостей проекта
echo "==> Устанавливаю зависимости npm..."
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi

# 3. Установка PM2 (глобально), если отсутствует
if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> PM2 не найден, устанавливаю глобально..."
  npm install -g pm2
else
  echo "==> PM2: $(pm2 --version)"
fi

# 4. Папка логов
mkdir -p "${REPO_DIR}/logs"

# 5. Напоминание об аккаунтах Qwen
if [ ! -d "${REPO_DIR}/session" ] || [ -z "$(ls -A "${REPO_DIR}/session" 2>/dev/null || true)" ]; then
  echo "==> ВНИМАНИЕ: не найдено сохранённых аккаунтов Qwen."
  echo "    Перед первым запуском добавьте аккаунт:  npm run auth"
fi

# 6. Запуск/перезапуск через PM2
echo "==> Запускаю сервис через PM2..."
pm2 startOrReload "${REPO_DIR}/ecosystem.config.cjs" --update-env

# 7. Сохранение списка процессов для автозапуска
pm2 save

cat <<EOF

========================================================================
 Готово. Сервис 'qwen-free-api' запущен под PM2.

 Полезные команды:
   pm2 list                  — статус процессов
   pm2 logs qwen-free-api    — логи в реальном времени
   pm2 restart qwen-free-api — перезапуск
   pm2 stop qwen-free-api    — остановка

 Автозапуск при перезагрузке системы (выполнить ОДИН раз, нужен sudo):
   pm2 startup
 PM2 выведет готовую команду 'sudo env PATH=... pm2 startup systemd -u <user> ...'
 — скопируйте и выполните её, затем снова 'pm2 save'.
========================================================================
EOF
