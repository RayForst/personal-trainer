module.exports = {
  apps: [
    {
      name: 'personal-trainer',
      script: 'pnpm',
      args: 'start',
      cwd: process.cwd(),
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--no-deprecation',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      // Перезапуск при изменении файлов (только для разработки)
      watch: false,
      // Игнорировать изменения в этих папках
      ignore_watch: ['node_modules', '.next', 'logs', '*.log'],
    },
  ],
}
