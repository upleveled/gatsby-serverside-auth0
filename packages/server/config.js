require('dotenv').config();

if (
  typeof process.env.AUTH0_DOMAIN !== 'string' ||
  typeof process.env.AUTH0_CLIENT_ID !== 'string' ||
  typeof process.env.AUTH0_CLIENT_SECRET !== 'string' ||
  typeof process.env.EXPRESS_SESSION_SECRET !== 'string'
) {
  console.error(`Error: all of the following environment variables need to be set:
- AUTH0_DOMAIN
- AUTH0_CLIENT_ID
- AUTH0_CLIENT_SECRET
- EXPRESS_SESSION_SECRET`);
  process.exit(1);
}

module.exports = {
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET,
  PORT: process.env.PORT,
};
