const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.GEMINI_KEY_ENCRYPTION_SECRET;

if (!SECRET_KEY || SECRET_KEY.length < 32) {
  console.error('FATAL ERROR: GEMINI_KEY_ENCRYPTION_SECRET is not defined or is too short (must be 32 bytes).');
}

const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data.');
  }
}

function decrypt(text) {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format.');
    }
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Key might be invalid or data corrupted.'); 
  }
}

module.exports = { encrypt, decrypt };