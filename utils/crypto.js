import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// We derive a 32-byte key from your existing private key (or any secret string)
const SECRET_KEY = crypto.createHash('sha256').update(String(process.env.SHELBY_PRIVATE_KEY)).digest();

export function encrypt(text) {
  const iv = crypto.randomBytes(16); // Random "Initialization Vector" for uniqueness
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // We return IV:EncryptedText so we can decrypt it later
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(text) {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return null; // Failed to decrypt (wrong key or corrupted)
  }
}