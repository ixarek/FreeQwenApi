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
- **Корректный usage / context %**: `prompt_tokens` в ответах и в стриминге — клиенты (Hermes и др.) правильно показывают заполнение контекста

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

## Развёртывание на VPS (авторизация на ПК → перенос session)

Этот релиз рассчитан на постоянную работу на **VPS** (Linux + PM2). Но
**первичная авторизация в Qwen Chat выполняется на обычном ПК** — потому что
вход требует интерактивного браузера (Puppeteer открывает окно для логина / QR /
капчи), а на «голом» VPS без графической оболочки это неудобно. Поэтому порядок
развёртывания такой:

1. **На ПК** (например, Windows; проект склонирован в `C:\Users\user\FreeQwenApi`):

   ```bash
   npm install
   npm run auth          # откроется браузер — войдите в свой аккаунт Qwen Chat
   ```

   После успешного входа токены и cookies сохранятся в папке **`session/`**
   (на Windows это `C:\Users\user\FreeQwenApi\session`).

2. **Скопируйте папку `session/` на VPS** — целиком, в корень проекта:

   ```
   C:\Users\user\FreeQwenApi\session   →   /home/user/FreeQwenApi/session
   ```

   Например, через `scp` (из PowerShell/терминала на ПК):

   ```bash
   scp -r C:\Users\user\FreeQwenApi\session user@vps:/home/user/FreeQwenApi/
   ```

3. **На VPS запустите установку заново** — теперь сервис поднимется уже с готовыми
   токенами, без интерактивного входа:

   ```bash
   cd /home/user/FreeQwenApi
   npm run setup
   ```

> Папка `session/` намеренно **исключена из git** (см. «Безопасность»), поэтому
> при клонировании на VPS её там не будет — переносите вручную. Когда токен
> истечёт, повторите шаги 1–2 на ПК (`npm run auth -- --relogin`) и снова
> скопируйте `session/` на VPS, затем `pm2 restart qwen-free-api`.

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

## Как это работает: usage и заполнение контекста (context %)

OpenAI-совместимые клиенты (в т.ч. Hermes Agent) показывают «процент заполнения
контекста» как `использованные_токены / размер_контекстного_окна`. Число
использованных токенов клиент берёт из поля `usage` в ответе. Здесь есть два
подводных камня:

1. **Разные имена полей.** Qwen Chat отдаёт usage в формате DashScope —
   `input_tokens` / `output_tokens`, — а OpenAI SDK ищет
   `prompt_tokens` / `completion_tokens`. Если их нет, клиент видит 0 токенов.
2. **usage при стриминге.** При `stream: true` usage приходит не в каждом чанке,
   а отдельным финальным чанком, и только если клиент запросил его через
   `stream_options: { include_usage: true }`.

Прокси закрывает оба случая:

- **Нормализация полей** — в каждый ответ добавляются `prompt_tokens`,
  `completion_tokens`, `total_tokens`, при этом `input_tokens` / `output_tokens`
  сохраняются как алиасы (обратная совместимость, ничего не ломается).
- **usage в стриминге** — при `stream_options.include_usage: true` перед
  `data: [DONE]` отправляется финальный чанк с `choices: []` и полем `usage`
  (как требует спецификация OpenAI). Без этого флага поведение не меняется.

В итоге клиенты вроде Hermes корректно считают
`context_pct = prompt_tokens / context_length`, и индикатор контекста перестаёт
залипать на 0%.

## Что изменено в этом релизе

- `src/utils/usage.js` — новый хелпер `normalizeUsage()`: добавляет
  `prompt_tokens` / `completion_tokens` / `total_tokens`, сохраняя
  `input_tokens` / `output_tokens` как алиасы.
- `src/api/routes.js` — нормализация usage во всех OpenAI-ответах и эмиссия
  usage в финальном чанке стрима при `stream_options.include_usage`.
- `ecosystem.config.cjs` — пути PM2 вычисляются от `__dirname` (запуск из любой
  папки), env-переменные переопределяемы; убран хардкод `qwen-service-workspace`.
- `scripts/setup.sh` + `npm run setup` — установка зависимостей, PM2 и автозапуск
  одной командой.
- `README` — разделы установки/PM2 переписаны под запуск из репозитория; добавлены
  инструкции по развёртыванию на VPS (авторизация на ПК → перенос `session/`).

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
