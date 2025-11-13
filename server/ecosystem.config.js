/**
 * PM2 Ecosystem Configuration
 * Configuración para clustering y escalabilidad de Node.js
 * Uso: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'academicchain-api',
      script: './src/server.js',
      instances: process.env.PM2_INSTANCES || 'max', // Usar todos los CPUs disponibles
      exec_mode: 'cluster', // Modo cluster para mejor escalabilidad
      watch: process.env.NODE_ENV === 'development',
      ignore_watch: ['node_modules', 'logs', '*.log'],
      
      // Variables de entorno
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '1G',
      
      // Advanced settings
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Instance variables
      instance_var: 'INSTANCE_ID',
      
      // Source map support
      source_map_support: true,
      
      // Graceful shutdown
      shutdown_with_message: true,
    },
    {
      name: 'academicchain-worker',
      script: './src/workers/index.js',
      instances: process.env.WORKER_INSTANCES || 2, // Workers separados
      exec_mode: 'fork', // Workers en modo fork (no cluster)
      watch: false,
      
      env: {
        NODE_ENV: 'development',
        WORKER_ONLY: 'true',
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_ONLY: 'true',
      },
      
      // Logging
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      log_file: './logs/pm2-worker-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '512M',
      
      kill_timeout: 5000,
    },
  ],

  // Deployment configuration (opcional, para CI/CD)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/academicchain-ledger.git',
      path: '/var/www/academicchain-ledger',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};

