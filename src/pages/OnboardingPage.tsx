import React, { useState } from "react";
import { useAuth } from "../contexts/DevAuthContext";
import { Button } from "../components/ui/button";

const OnboardingPage: React.FC = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    rank: user?.rank || "",
    email: user?.email || "",
    orgId: user?.orgId || "",
    userId: user?.userId || ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        setLoading(false);
        return;
      }
      // Update user context with new info
      login({ ...user, ...form, sub: user?.sub || "" }, localStorage.getItem("token") || "");
      setSuccess(true);
    } catch (err) {
      setError("Network error or server unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-950">
      <form onSubmit={handleSubmit} className="bg-white/10 p-8 rounded-lg shadow-md w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
        <label className="block mb-2">
          Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded text-black"
          />
        </label>
        <label className="block mb-2">
          Rank
          <input
            name="rank"
            value={form.rank}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded text-black"
          />
        </label>
        <label className="block mb-2">
          Email
          <input
            name="email"
            value={form.email}
            disabled
            className="w-full px-3 py-2 rounded text-black bg-gray-200"
          />
        </label>
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
        {success && <div className="text-green-400 mt-2">Profile updated!</div>}
        {error && <div className="text-red-400 mt-2">{error}</div>}
      </form>
    </div>
  );
};

export default OnboardingPage;