import 'dotenv/config';

export default {
  schema: './lib/db/schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'maple_hub',
    password: process.env.DB_PASSWORD || 'maple_hub',
    database: process.env.DB_NAME || 'maple_hub',
  },
};
