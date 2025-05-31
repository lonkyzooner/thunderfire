import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const LoginPage: React.FC = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    orgId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      // Store JWT in localStorage (or HttpOnly cookie in production)
      localStorage.setItem('token', data.token);
      // Optionally store user/org info
      localStorage.setItem('user', JSON.stringify(data.user));
      // Redirect to dashboard or main app
      window.location.href = '/';
    } catch (err) {
      setError('Network error or server unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-950">
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md text-white border-blue-700">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">LARK</CardTitle>
          <CardDescription className="text-blue-200">
            Law Enforcement Assistance and Response Kit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold">Welcome</h3>
            <p className="text-sm text-blue-200">
              Sign in to access your LARK assistant
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              name="orgId"
              placeholder="Organization ID"
              value={form.orgId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded text-black"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded text-black"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded text-black"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            {error && <div className="text-red-400 text-center">{error}</div>}
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full text-center">
            <a href="/SignupPage" className="text-blue-300 hover:underline">
              Don&apos;t have an account? Sign up
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
