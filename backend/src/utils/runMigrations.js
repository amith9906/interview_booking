const { spawn } = require('child_process');
const path = require('path');

const backendRoot = path.resolve(__dirname, '../..');

const shouldSkipMigrations = () =>
  process.env.SKIP_MIGRATIONS === 'true' || process.env.NODE_ENV === 'test';

const runPendingMigrations = () => {
  if (shouldSkipMigrations()) {
    console.info('[Migrations] skipping migrations (SKIP_MIGRATIONS=true or NODE_ENV=test)');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    console.info('[Migrations] running pending migrations');
    const migrate = spawn('npx sequelize-cli db:migrate', {
      cwd: backendRoot,
      env: process.env,
      shell: true,
      stdio: 'inherit'
    });

    migrate.once('close', (code) => {
      if (code === 0) {
        console.info('[Migrations] migrations finished');
        return resolve();
      }
      return reject(new Error(`Migration command exited with code ${code}`));
    });

    migrate.once('error', (err) => {
      reject(err);
    });
  });
};

module.exports = { runPendingMigrations };
