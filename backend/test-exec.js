const { exec } = require('child_process');
const env = { ...process.env };
delete env.CORS_ORIGINS;
exec(`node dist/main.js`, { env, timeout: 5000 }, (error, stdout, stderr) => {
  console.log("ERROR:", error);
  console.log("STDOUT:", stdout);
  console.log("STDERR:", stderr);
});
