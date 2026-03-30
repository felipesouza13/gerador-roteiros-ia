module.exports = {
  apps: [
    {
      name: 'gerador-roteiros',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 5780,
      },
    },
  ],
};
