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
  TESTINATOR_TEAM_ID: str({ default: 'team214166.testinator.com' }),
  SEED_EMAIL: email({ default: 'example@team214166.testinator.com' }),
  TIMEOUT: num({ default: 5000 }),
  TESTINATOR_API_KEY: str({ default: '565ea3b28b074fe1b1bcadeef8df2008' }),
  FETCH_EMAILS_INBOX: str({
    default: 'https://api.mailinator.com/api/v2/domains/private/inboxes?token=',
  }),
  FETCH_SPECIFIC_EMAIL: str({
    default: 'https://mailinator.com/api/v2/domains/private/messages/',
  }),
  API_BASE_URL: str({ default: 'http://localhost:4000' }),
  ADMIN_EMAIL: str({ default: 'example+admin-1@team214166.testinator.com' }),
  JEST_HTML_REPORTER_FILE_NAME: str({ default: 'test.html' }),
  IMAP_EMAIL: str({ default: 'qa@itobuz.wordpress-studio.io' }),

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
