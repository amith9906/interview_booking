const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const normalizeOrigins = (originEnv) => {
  if (!originEnv) {
    return [];
  }
  return Array.from(
    new Set(
      originEnv
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
  );
};

const ensureEnvVars = (names, { productionOnly = false } = {}) => {
  const environment = process.env.NODE_ENV || 'development';
  if (productionOnly && environment !== 'production') {
    return;
  }

  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

const parseAllowedOrigins = (originEnv) => {
  const environment = process.env.NODE_ENV || 'development';
  const configuredOrigins = normalizeOrigins(originEnv);
  if (environment === 'production') {
    return configuredOrigins;
  }

  if (!configuredOrigins.length) {
    return DEFAULT_DEV_ORIGINS;
  }

  return Array.from(new Set([...configuredOrigins, ...DEFAULT_DEV_ORIGINS]));
};

module.exports = {
  ensureEnvVars,
  parseAllowedOrigins
};
