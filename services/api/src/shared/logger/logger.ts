export const logger = {
  info(message: string) {
    console.log(`ℹ️ ${message}`);
  },

  success(message: string) {
    console.log(`✅ ${message}`);
  },

  warn(message: string) {
    console.warn(`⚠️ ${message}`);
  },

  error(message: string, error?: unknown) {
    console.error(`❌ ${message}`);

    if (error) {
      console.error(error);
    }
  },
};