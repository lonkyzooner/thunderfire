const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveKey(password: string, salt: Uint8Array) {
  const pwKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  // return base64-encoded values
  return {
    cipher: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
    iv: Array.from(iv),
    salt: Array.from(salt)
  };
}

export async function decryptData(encrypted: { cipher: string; iv: number[]; salt: number[] }, password: string) {
  const iv = new Uint8Array(encrypted.iv);
  const salt = new Uint8Array(encrypted.salt);
  const key = await deriveKey(password, salt);
  const cipherBytes = Uint8Array.from(atob(encrypted.cipher), c => c.charCodeAt(0));
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBytes
  );
  return decoder.decode(plainBuffer);
}
