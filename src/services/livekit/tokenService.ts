// Constants for LiveKit configuration
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;
if (!LIVEKIT_URL) {
  throw new Error('[tokenService] Missing required environment variable: VITE_LIVEKIT_URL');
}

// API URL for the backend server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

import { AccessToken } from 'livekit-server-sdk';
// All LiveKit credentials must be provided via environment variables for all environments.

// Token generation will now use the proper API secret instead of a pre-generated demo token

/**
 * Get a secure token from the backend API
 * This is the recommended approach for production use
 * 
 * @param roomName The name of the room to join
 * @param identity The participant identity
 * @returns The token
 */
export async function getSecureToken(roomName: string, identity: string): Promise<string> {
  try {
    // Generate a random session ID to make the room name unique
    const sessionId = Math.random().toString(36).substring(2, 15);
    const uniqueRoomName = `${roomName}-${sessionId}`;
    
    console.log(`[TokenService] Getting token for room: ${uniqueRoomName}, identity: ${identity}`);
    
    // First try to get the token from our secure backend
    try {
      return await getTokenFromBackend(uniqueRoomName, identity);
    } catch (backendError) {
      console.warn('[TokenService] Backend token generation failed, using fallback:', backendError);
      
      // In all environments, fail if backend token generation fails
      throw backendError;
    }
  } catch (error) {
    console.error('[TokenService] Error getting token:', error);
    throw error;
  }
}

/**
 * Get a token from our secure backend API
 * This is the recommended approach for production use
 * @param roomName Room to create token for
 * @param identity User identity
 * @returns Generated token
 */
async function getTokenFromBackend(roomName: string, identity: string): Promise<string> {
  try {
    console.log(`[TokenService] Requesting token from backend for room: ${roomName}, identity: ${identity}`);
    
    const response = await fetch(`${API_BASE_URL}/api/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName, userId: identity }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get token: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('[TokenService] Error getting token from backend:', error);
    throw error;
  }
}

/**
 * Generate a LiveKit token locally - FOR DEVELOPMENT ONLY
 * This should never be used in production as it exposes API keys
 * @param roomName Room to create token for
 * @param identity User identity
 * @returns Generated token
 */
// Development fallback token generation has been removed for security. All tokens must be generated securely via backend and environment variables.

/**
 * Get a token for a LiveKit agent
 * @param roomName The name of the room to join
 * @returns The generated token
 */
export async function generateAgentToken(roomName: string): Promise<string> {
  return getSecureToken(roomName, 'lark-agent');
}

/**
 * Get a token for a LiveKit user
 * @param roomName The name of the room to join
 * @param userId The user ID
 * @returns The generated token
 */
export async function generateUserToken(roomName: string, userId: string): Promise<string> {
  return getSecureToken(roomName, `user-${userId}`);
}
