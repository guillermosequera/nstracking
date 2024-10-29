// src/config/authConfig.js

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    logger: {
      error: (code, metadata) => {
        console.error(code, metadata);
      },
      warn: (code) => {
        console.warn(code);
      },
      debug: (code, metadata) => {
        console.log(code, metadata);
      },
    },
  };