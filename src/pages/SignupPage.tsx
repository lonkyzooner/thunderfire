import React, { useState } from "react";
import { Button } from "../components/ui/button";
import LarkLogo from "../components/LarkLogo";

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  department: string;
  rank: string;
  inviteCode?: string;
  plan: string;
}

const plans = [
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const SignupPage: React.FC = () => {
  const [form, setForm] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    department: "",
    rank: "",
    inviteCode: "",
    plan: plans[0].value,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlanChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      plan: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/register-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      // Optionally, redirect to payment or dashboard here
    } catch (err) {
      setError("Network error or server unavailable");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <LarkLogo className="w-12 h-12 mb-2" />
          <h2 className="text-3xl font-bold text-white mb-2">Sign Up for LARK</h2>
          <p className="text-blue-200 mb-4 text-center">
            Create your account to get started with modern law enforcement tools.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 rounded text-black" />
          </div>
          <div>
            <label className="block text-white mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2 rounded text-black" />
          </div>
          <div>
            <label className="block text-white mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full px-3 py-2 rounded text-black" />
          </div>
          <div>
            <label className="block text-white mb-1">Department/Org Name</label>
            <input name="department" value={form.department} onChange={handleChange} required className="w-full px-3 py-2 rounded text-black" />
          </div>
          <div>
            <label className="block text-white mb-1">Rank</label>
            <input name="rank" value={form.rank} onChange={handleChange} required className="w-full px-3 py-2 rounded text-black" />
          </div>
          <div>
            <label className="block text-white mb-1">Invite Code (optional)</label>
            <input name="inviteCode" value={form.inviteCode} onChange={handleChange} className="w-full px-3 py-2 rounded text-black" />
          </div>
          <div>
            <label className="block text-white mb-2">Choose a Plan</label>
            <div className="flex gap-4">
              {plans.map((plan) => (
                <label key={plan.value} className={`flex-1 cursor-pointer rounded border-2 px-4 py-2 text-center ${form.plan === plan.value ? "border-blue-400 bg-blue-800 text-white" : "border-gray-300 bg-white text-black"}`}>
                  <input
                    type="radio"
                    name="plan"
                    value={plan.value}
                    checked={form.plan === plan.value}
                    onChange={() => handlePlanChange(plan.value)}
                    className="hidden"
                  />
                  {plan.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
          {error && <div className="text-red-400 text-center">{error}</div>}
          {success && <div className="text-green-400 text-center">Signup successful! Redirecting...</div>}
        </form>
        <div className="text-center mt-4">
          <span className="text-blue-200">Already have an account? </span>
          <a href="/login" className="text-blue-400 hover:underline">Log in</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;