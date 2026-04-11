const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Ensure key is exactly 32 bytes for AES-256
const getEncryptionKey = () => {
  const raw = process.env.ENCRYPTION_KEY || 'impactlink_default_key_32bytes!';
  // Pad or truncate to exactly 32 bytes
  const key = Buffer.alloc(32);
  Buffer.from(raw).copy(key);
  return key;
};

const ENCRYPTION_KEY = getEncryptionKey();

const encrypt = (text) => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error.message);
    return text; // Return plaintext as fallback to prevent data loss
  }
};

const decrypt = (text) => {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return text; // Return as-is to prevent crash
  }
};

module.exports = { encrypt, decrypt };
