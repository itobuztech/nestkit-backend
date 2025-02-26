import { bool, cleanEnv, email, num, str, makeValidator } from 'envalid';

const awsConfigValidator = makeValidator((value) => {
  if (process.env.isS3Enabled && process.env.isS3Enabled === 'true') {
    if (!value) {
      throw new Error('Field is required');
    }
  }

  return value;
});
// Validate and load environment variables
export const appEnv = cleanEnv(process.env, {
  NODE_ENV: str({
    default: 'development',
    choices: ['development', 'production', 'test'],
  }),
  DATABASE_URL: str({ desc: 'Please provide DB URL' }),
  MAILHOG_API_ROOT: str({ default: 'http://localhost:8025' }),
  SEED_PASSWORD: str({ default: 'SamLauncher@123' }),
  

  SEED_EMAIL: email({ default: 'example@example.com' }),
  TIMEOUT: num({ default: 5000 }),
  API_BASE_URL: str({ default: 'http://localhost:4000' }),
  JEST_HTML_REPORTER_FILE_NAME: str({ default: 'test.html' }),

   // AWS
   AWS_REGION: awsConfigValidator({ default: '' }),
   AWS_ACCESS_KEY_ID: awsConfigValidator({ default: '' }),
   AWS_SECRET_ACCESS_KEY: awsConfigValidator({ default: '' }),
   AWS_PUBLIC_BUCKET: awsConfigValidator({ default: '' }),
   AWS_SECURE_BUCKET: awsConfigValidator({ default: '' }),
   AWS_PUBLIC_BUCKET_URL: awsConfigValidator({ default: '' }),
   AWS_SIGNED_URL_EXPIRY: num({ default: 3600 }),
   isS3Enabled: bool({ default: false }),

  // Imap
  IMAP_HOST: str({ default: 'imap.hostinger.com' }),
  IMAP_PORT: num({ default: 993 }),
  IMAP_TLS: bool({ default: true }),
  IMAP_USER: str(),
  IMAP_PASSWORD: str(),
});
