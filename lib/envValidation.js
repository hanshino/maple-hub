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

  // Google Sheets API (optional for basic functionality)
  GOOGLE_SHEETS_PROJECT_ID: {
    description: 'Google Sheets API project ID',
    required: false,
    validate: value => !value || value.length > 0,
  },
  GOOGLE_SHEETS_PRIVATE_KEY_ID: {
    description: 'Google Sheets API private key ID',
    required: false,
    validate: value => !value || value.length > 0,
  },
  GOOGLE_SHEETS_PRIVATE_KEY: {
    description: 'Google Sheets API private key',
    required: false,
    validate: value => !value || value.includes('BEGIN PRIVATE KEY'),
  },
  GOOGLE_SHEETS_CLIENT_EMAIL: {
    description: 'Google Sheets API service account email',
    required: false,
    validate: value =>
      !value ||
      (value.includes('@') && value.includes('.iam.gserviceaccount.com')),
  },
  GOOGLE_SHEETS_CLIENT_ID: {
    description: 'Google Sheets API client ID',
    required: false,
    validate: value => !value || value.length > 0,
  },
  GOOGLE_SHEETS_CLIENT_X509_CERT_URL: {
    description: 'Google Sheets API certificate URL',
    required: false,
    validate: value => !value || value.startsWith('https://'),
  },
  SPREADSHEET_ID: {
    description: 'Google Sheets spreadsheet ID for OCID logging',
    required: false,
    validate: value => !value || value.length > 10,
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

  // Check for OCID logging completeness
  const hasAllGoogleSheetsVars = [
    'GOOGLE_SHEETS_PROJECT_ID',
    'GOOGLE_SHEETS_PRIVATE_KEY_ID',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_CLIENT_ID',
    'GOOGLE_SHEETS_CLIENT_X509_CERT_URL',
    'SPREADSHEET_ID',
  ].every(key => process.env[key]);

  if (!hasAllGoogleSheetsVars) {
    warnings.push(
      'OCID logging to Google Sheets is disabled due to missing environment variables'
    );
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
