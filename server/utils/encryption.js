const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from password/secret
 */
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: salt:iv:encrypted:tag (all base64)
 */
function encrypt(text) {
    if (!process.env.MFA_ENCRYPTION_KEY) {
        throw new Error('MFA_ENCRYPTION_KEY not set in environment');
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(process.env.MFA_ENCRYPTION_KEY, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    return [
        salt.toString('base64'),
        iv.toString('base64'),
        encrypted,
        tag.toString('base64')
    ].join(':');
}

/**
 * Decrypt data
 * @param {string} encryptedData - Encrypted text in format: salt:iv:encrypted:tag
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
    if (!process.env.MFA_ENCRYPTION_KEY) {
        throw new Error('MFA_ENCRYPTION_KEY not set in environment');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
    }

    const salt = Buffer.from(parts[0], 'base64');
    const iv = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    const tag = Buffer.from(parts[3], 'base64');

    const key = deriveKey(process.env.MFA_ENCRYPTION_KEY, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = { encrypt, decrypt };
