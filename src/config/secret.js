const crypto = require('crypto');
const hashedSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

module.exports = { hashedSecret };