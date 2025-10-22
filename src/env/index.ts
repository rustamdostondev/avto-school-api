import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config({ path: '.env' });

// Server config
const PORT: number = +process.env.PORT || 5001;

// Postgres config
const PG_HOST = process.env.PG_HOST;
const PG_PORT = +process.env.PG_PORT || 5432;
const PG_DB = process.env.PG_DB;
const PG_USER = process.env.PG_USER;
const PG_PASS = process.env.PG_PASS;

// Redis config
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASS = process.env.REDIS_PASS;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_DB = process.env.REDIS_DB;

// Node config
const NODE_ENV = process.env.NODE_ENV || 'production';

// Minio config
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_BUCKET = process.env.MINIO_BUCKET;
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_PORT = process.env.MINIO_PORT;

// OpenAI config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// PARSER_KEY is now optional as we're using a custom free parser implementation
const PARSER_KEY = process.env.PARSER_KEY;

// Mail config
const GMAIL_SERVICE = process.env.GMAIL_SERVICE;
const GMAIL_SUPPORT_NAME = process.env.GMAIL_SUPPORT_NAME;
const GMAIL_SUPPORT_PASS = process.env.GMAIL_SUPPORT_PASS;

// Qdrant config
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

// Google OAuth config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

export {
  NODE_ENV,
  PG_DB,
  PG_HOST,
  PG_PASS,
  PG_PORT,
  PG_USER,
  PORT,
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASS,
  REDIS_PORT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_ENDPOINT,
  MINIO_PORT,
  OPENAI_API_KEY,
  PARSER_KEY,
  GMAIL_SERVICE,
  GMAIL_SUPPORT_NAME,
  GMAIL_SUPPORT_PASS,
  QDRANT_URL,
  QDRANT_API_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
};
