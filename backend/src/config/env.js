function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function getAllowedCorsOrigins() {
  const configuredOrigin = process.env.FRONTEND_URL?.trim();
  const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  return [...new Set([configuredOrigin, ...devOrigins].filter(Boolean))];
}

module.exports = {
  getRequiredEnv,
  getAllowedCorsOrigins
};
