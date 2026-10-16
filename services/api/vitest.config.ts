import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      MONGO_URI: "mongodb://localhost:27017/interviewos-test",
      JWT_SECRET: "test-secret-key-that-is-long-enough-0000000000",
      JWT_EXPIRES_IN: "15m",
      CLIENT_URL: "http://localhost:5173",
      SMTP_HOST: "localhost",
      SMTP_PORT: "587",
      SMTP_USER: "test",
      SMTP_PASS: "test",
      MAIL_FROM: "test@example.com",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});