import { bool, cleanEnv, email, num, str } from 'envalid';

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
   isS3Enabled: bool({ default: false }),

  // TESTING 
  AWS_REGION: str(),
  AWS_BUCKET_NAME: str(),
  AWS_BUCKET_UPLOAD_PATH: str({ default: 'example' }),
  AWS_BUCKET_PUBLIC_URL: str(),
  AWS_REPORT_UPLOAD: bool({ default: false }),


  // Imap
  IMAP_HOST: str({ default: 'imap.hostinger.com' }),
  IMAP_PORT: num({ default: 993 }),
  IMAP_TLS: bool({ default: true }),
  IMAP_USER: str(),
  IMAP_PASSWORD: str(),
});
