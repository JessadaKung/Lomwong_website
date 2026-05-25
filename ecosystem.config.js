module.exports = {
  apps: [
    {
      name: "lomwong-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      },
      restart_delay: 3000,
      watch: false
    },
    {
      name: "lomwong-backend",
      cwd: "./backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: "4000"
      },
      restart_delay: 3000,
      watch: false
    }
  ]
};
