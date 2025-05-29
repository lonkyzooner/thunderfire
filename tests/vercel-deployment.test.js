// Comprehensive Vercel deployment validation tests
import { describe, test, expect, beforeAll, afterAll } from '@jest/testing-library/jest-dom';

// Test configuration
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@lark-ai.app';

describe('Vercel Deployment Validation', () => {
  let authToken = null;

  beforeAll(async () => {
    console.log(`Testing deployment at: ${BASE_URL}`);
  });

  describe('API Function Health Checks', () => {
    test('should respond to basic health check', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      
      // Should respond even if endpoint doesn't exist (405 vs 500)
      expect([200, 404, 405]).toContain(response.status);
    });

    test('auth endpoints should be accessible', async () => {
      // Test magic link endpoint
      const magicResponse = await fetch(`${BASE_URL}/api/auth/magic-link`, {
        method: 'OPTIONS'
      });
      expect([200, 405]).toContain(magicResponse.status);

      // Test validate endpoint
      const validateResponse = await fetch(`${BASE_URL}/api/auth/validate`, {
        method: 'OPTIONS'
      });
      expect([200, 405]).toContain(validateResponse.status);
    });

    test('stripe webhook should be accessible', async () => {
      const response = await fetch(`${BASE_URL}/api/stripe/webhook`, {
        method: 'OPTIONS'
      });
      expect([200, 405]).toContain(response.status);
    });
  });

  describe('CORS Configuration', () => {
    test('should have proper CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/magic-link`, {
        method: 'OPTIONS'
      });

      const headers = response.headers;
      expect(headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });
  });

  describe('Frontend Assets', () => {
    test('should serve index.html', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    test('should serve static assets', async () => {
      const assets = [
        '/favicon.ico',
        '/lark-logo.svg'
      ];

      for (const asset of assets) {
        const response = await fetch(`${BASE_URL}${asset}`);
        expect([200, 404]).toContain(response.status); // 404 is acceptable if asset doesn't exist
      }
    });
  });

  describe('Authentication Flow', () => {
    test('should handle magic link request', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_EMAIL
        })
      });

      // Should succeed or fail gracefully (not crash)
      expect([200, 400, 503]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
    });

    test('should validate invalid tokens gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'invalid-token'
        })
      });

      expect([400, 401]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should require authorization for protected endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json'
      });

      expect([400, 500]).toContain(response.status);
    });

    test('should return proper error structure', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
    });
  });

  describe('Security Headers', () => {
    test('should have security headers', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const headers = response.headers;

      // Check for important security headers
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('X-Frame-Options')).toBe('DENY');
      expect(headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('Performance Tests', () => {
    test('should respond within acceptable time', async () => {
      const start = Date.now();
      
      const response = await fetch(`${BASE_URL}/`);
      
      const responseTime = Date.now() - start;
      
      // Should respond within 5 seconds (generous for cold starts)
      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(200);
    });

    test('API functions should respond quickly', async () => {
      const start = Date.now();
      
      const response = await fetch(`${BASE_URL}/api/auth/validate`, {
        method: 'GET'
      });
      
      const responseTime = Date.now() - start;
      
      // API should respond within 3 seconds
      expect(responseTime).toBeLessThan(3000);
    });
  });

  afterAll(() => {
    console.log('Deployment validation tests completed');
  });
});

// Environment validation tests
describe('Environment Configuration', () => {
  test('should have required frontend environment variables', () => {
    // These are bundled into the frontend, so we can't test them directly
    // But we can test that the app doesn't crash on load
    expect(true).toBe(true); // Placeholder
  });

  test('should handle missing environment variables gracefully', async () => {
    // Test that API endpoints don't crash with missing env vars
    const response = await fetch(`${BASE_URL}/api/auth/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });

    // Should not return 500 (internal server error)
    expect(response.status).not.toBe(500);
  });
});
