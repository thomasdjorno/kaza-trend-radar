module.exports = {
  apps: [
    {
      name: "kaza-trend-radar",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
    },
  ],
};
