/**
 * Environment variable validation utility
 * Validates required environment variables and provides helpful error messages
 */

const requiredEnvVars = {
  // Nexon API
  NEXT_PUBLIC_API_BASE_URL: {
    description: 'Nexon MapleStory OpenAPI base URL',
    validate: value => value && value.startsWith('https://'),
  },
  API_KEY: {
    description: 'Nexon MapleStory OpenAPI key',
    validate: value => value && value.length > 10,
  },

  // Database
  DB_HOST: {
    description: 'MySQL host',
    required: false,
    validate: value => !value || value.length > 0,
  },
  DB_PORT: {
    description: 'MySQL port',
    required: false,
    validate: value => !value || !isNaN(parseInt(value)),
  },
  DB_USER: {
    description: 'MySQL user',
    required: false,
    validate: value => !value || value.length > 0,
  },
  DB_PASSWORD: {
    description: 'MySQL password',
    required: false,
    validate: value => !value || value.length > 0,
  },
  DB_NAME: {
    description: 'MySQL database name',
    required: false,
    validate: value => !value || value.length > 0,
  },
  REDIS_HOST: {
    description: 'Redis host',
    required: false,
    validate: value => !value || value.length > 0,
  },
  REDIS_PORT: {
    description: 'Redis port',
    required: false,
    validate: value => !value || !isNaN(parseInt(value)),
  },
};

/**
 * Validates all environment variables
 * @returns {Object} Validation result with errors and warnings
 */
export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];

    if (config.required !== false && !value) {
      errors.push(
        `Missing required environment variable: ${key} (${config.description})`
      );
    } else if (value && !config.validate(value)) {
      errors.push(
        `Invalid environment variable: ${key} (${config.description})`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment on module load and logs results
 * Call this function early in your application startup
 */
export function validateEnvironmentOnLoad() {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }

  return result;
}
