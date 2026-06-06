module.exports = {
  apps: [{
    name: 'qwen-free-api',
    script: 'index.js',
    cwd: '/home/openclaw/qwen-service-workspace',
    node_args: '--experimental-modules',
    env: {
      NODE_ENV: 'production',
      PORT: 3264,
      HOST: '0.0.0.0',
      SKIP_ACCOUNT_MENU: 'true'
    },
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 3000,
    autorestart: true,
    watch: false,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/home/openclaw/qwen-service-workspace/logs/pm2-error.log',
    out_file: '/home/openclaw/qwen-service-workspace/logs/pm2-out.log',
    merge_logs: true
  }]
};
