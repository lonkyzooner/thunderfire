// chat-storage.ts
// [CLEARED] Previous chat storage logic removed.
// Ready for new chat storage implementation from scratch.

import { encryptData, decryptData } from '../utils/browserCrypto';
import * as idbKeyval from 'idb-keyval';

const STORAGE_KEY = 'chatHistory';
const PASSWORD = import.meta.env.VITE_APP_AES_PASSWORD || 'default-password';

export async function loadChatHistory() {
  try {
    const encrypted = await idbKeyval.get(STORAGE_KEY);
    if (!encrypted) return [];
    const decrypted = await decryptData(encrypted, PASSWORD);
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Failed to load chat history:', err);
    return [];
  }
}

export async function saveChatHistory(history: any[]) {
  try {
    const json = JSON.stringify(history);
    const encrypted = await encryptData(json, PASSWORD);
    await idbKeyval.set(STORAGE_KEY, encrypted);
  } catch (err) {
    console.error('Failed to save chat history:', err);
  }
}
