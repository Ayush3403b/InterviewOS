import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  PORT: Number(process.env.PORT ?? 5000),

  MONGO_URI: required("MONGO_URI"),

  JWT_SECRET: required("JWT_SECRET"),

  JWT_EXPIRES_IN: required("JWT_EXPIRES_IN"),

  CLIENT_URL: required("CLIENT_URL"),

  SMTP_HOST: required("SMTP_HOST"),

  SMTP_PORT: Number(required("SMTP_PORT")),

  SMTP_USER: required("SMTP_USER"),

  SMTP_PASS: required("SMTP_PASS"),

  MAIL_FROM: required("MAIL_FROM"),
};