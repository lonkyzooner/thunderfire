import React, { useState } from "react";

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
    <div className="signup-page">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <label>
          Department/Org Name
          <input name="department" value={form.department} onChange={handleChange} required />
        </label>
        <label>
          Rank
          <input name="rank" value={form.rank} onChange={handleChange} required />
        </label>
        <label>
          Invite Code (optional)
          <input name="inviteCode" value={form.inviteCode} onChange={handleChange} />
        </label>
        <label>
          Subscription Plan
          <select name="plan" value={form.plan} onChange={handleChange}>
            {plans.map((plan) => (
              <option key={plan.value} value={plan.value}>
                {plan.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">Signup successful! Redirecting...</div>}
      </form>
    </div>
  );
};

export default SignupPage;