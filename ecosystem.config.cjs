// PM2 конфигурация. Все пути вычисляются относительно расположения этого файла,
// поэтому сервис работает из любой папки, куда склонирован репозиторий.
const path = require('path');

const repoDir = __dirname;
const logsDir = path.join(repoDir, 'logs');

module.exports = {
  apps: [{
    name: 'qwen-free-api',
    script: 'index.js',
    cwd: repoDir,
    node_args: '--experimental-modules',
    env: {
      NODE_ENV: 'production',
      // Значения по умолчанию; переопределяются переменными окружения при запуске
      PORT: process.env.PORT || 3264,
      HOST: process.env.HOST || '0.0.0.0',
      SKIP_ACCOUNT_MENU: process.env.SKIP_ACCOUNT_MENU || 'true'
    },
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 3000,
    autorestart: true,
    watch: false,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: path.join(logsDir, 'pm2-error.log'),
    out_file: path.join(logsDir, 'pm2-out.log'),
    merge_logs: true
  }]
};
