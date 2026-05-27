const required = ['DATABASE_URL', 'JWT_SECRET'];

export const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[Config] ❌ Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('[Config] ✅ Variables de entorno validadas correctamente');
};

export const config = {
  port: parseInt(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  resendApiKey: process.env.RESEND_API_KEY,
};
