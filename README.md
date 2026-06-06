# FreeQwenApi — Autonomous Service

> Локальный OpenAI-compatible прокси к Qwen Chat с автономным запуском через PM2.
> Fork от [t.me/forgetmeai](https://t.me/forgetmeai).

## Особенности

- **Автозапуск**: работает как системный сервис через PM2, не требует ручного вмешательства
- **Работает из репозитория**: пути PM2 вычисляются относительно папки проекта (`__dirname`)
- **OpenAI-compatible API**: `http://localhost:3264/api`
- **28 моделей Qwen Chat**: включая qwen3.7-max, qwen3-coder-plus, qwen3-vl-plus
- **Генерация изображений и видео**: через Qwen Chat без DASHSCOPE_API_KEY
- **Мультиаккаунты**: round-robin ротация при лимитах
- **Health-check**: `/api/health`, `/api/status`, `/api/models`

## Быстрый старт

```bash
git clone <repo-url> FreeQwenApi
cd FreeQwenApi
npm run auth          # добавить аккаунт Qwen Chat (хотя бы один)
npm run models:sync   # обновить список моделей
npm run setup         # установить зависимости + PM2 и запустить сервис
```

`npm run setup` сам устанавливает зависимости, ставит PM2 (если его нет),
создаёт папку логов, запускает сервис и сохраняет конфигурацию PM2.
Все пути в `ecosystem.config.cjs` вычисляются относительно репозитория,
поэтому установка работает из любой папки.

## Автозапуск (PM2)

Проще всего поднять сервис одной командой:

```bash
npm run setup
```

Либо вручную:

```bash
# Запустить сервис
pm2 start ecosystem.config.cjs

# Сохранить конфигурацию для автозапуска
pm2 save

# Настроить startup-скрипт (требуется один раз, нужен sudo)
pm2 startup
# PM2 выведет готовую команду 'sudo env PATH=... pm2 startup systemd -u <user> ...'
# — скопируйте и выполните её, затем снова 'pm2 save'.
```

После настройки startup-скрипта сервис будет автоматически запускаться при перезагрузке системы.

### Управление сервисом

```bash
pm2 list                    # статус всех процессов
pm2 logs qwen-free-api      # логи в реальном времени
pm2 restart qwen-free-api   # перезапуск
pm2 stop qwen-free-api      # остановка
pm2 delete qwen-free-api    # удаление из PM2
```

## Конфигурация PM2

Файл `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [{
    name: 'qwen-free-api',
    script: 'index.js',
    cwd: __dirname,            // путь к репозиторию вычисляется автоматически
    env: {
      NODE_ENV: 'production',
      PORT: 3264,
      HOST: '0.0.0.0',
      SKIP_ACCOUNT_MENU: 'true'
    },
    max_restarts: 10,
    autorestart: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log'
  }]
};
```

## API Endpoints

### Health Check
```bash
curl http://localhost:3264/api/health
```

### Список моделей
```bash
curl http://localhost:3264/api/models
```

### Chat Completions
```bash
curl http://localhost:3264/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.7-max",
    "messages": [{"role": "user", "content": "Привет!"}],
    "stream": false
  }'
```

### Генерация изображений
```bash
curl http://localhost:3264/api/images/generations \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Кинематографичный робот в неоновом Токио",
    "model": "qwen3-vl-plus",
    "size": "16:9"
  }'
```

### Генерация видео
```bash
curl http://localhost:3264/api/videos/generations \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Футуристический город ночью, cinematic",
    "model": "qwen3-vl-plus",
    "size": "16:9",
    "wait": true
  }'
```

## Подключение к Hermes Agent

Добавьте в `~/.hermes/config.yaml`:

```yaml
custom_providers:
  - name: qwen-free
    base_url: http://localhost:3264/api
    model: qwen3.7-max
    api_key: dummy-key
```

## Структура проекта

```
FreeQwenApi/                # корень репозитория (любая папка)
├── ecosystem.config.cjs    # PM2 конфигурация (пути относительно репозитория)
├── index.js                # основной сервер
├── session/                # токены аккаунтов (не коммитить!)
│   ├── tokens.json
│   └── accounts/
├── logs/                   # логи PM2
│   ├── pm2-out.log
│   └── pm2-error.log
├── src/                    # исходный код прокси
├── examples/               # примеры использования
└── docs/                   # документация
```

## Безопасность

**Никогда не коммитьте:**
- `session/` — токены и cookies
- `.env` — переменные окружения
- `logs/` — логи могут содержать чувствительные данные

Все эти пути уже добавлены в `.gitignore`.

## Ограничения

- Неофициальный browser-based proxy, Qwen может менять внутренний API
- Аккаунты могут ловить лимиты — используйте несколько аккаунтов для ротации
- Токены истекают — периодически выполняйте `npm run auth -- --relogin`
- URL сгенерированных медиа временные

## Логи и мониторинг

```bash
# Просмотр логов
pm2 logs qwen-free-api --lines 100

# Проверка здоровья
curl http://localhost:3264/api/health

# Статус аккаунтов
curl http://localhost:3264/api/status
```

## От ForgetMeAI

Если fork помог — подпишитесь: [t.me/forgetmeai](https://t.me/forgetmeai)
