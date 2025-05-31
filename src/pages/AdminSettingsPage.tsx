import React, { useState } from "react";
import { useUserDepartment } from "../contexts/UserDepartmentContext";

const AdminSettingsPage: React.FC = () => {
  const { department, setDepartment } = useUserDepartment();
  const [name, setName] = useState(department.name);
  const [logoUrl, setLogoUrl] = useState(department.logoUrl);
  const [primary, setPrimary] = useState(department.theme.primary);
  const [accent, setAccent] = useState(department.theme.accent);
  const [background, setBackground] = useState(department.theme.background);

  // Placeholder for logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, upload to backend/cloud and get URL
      const url = URL.createObjectURL(e.target.files[0]);
      setLogoUrl(url);
    }
  };

  const handleSave = () => {
    setDepartment({
      ...department,
      name,
      logoUrl,
      theme: { primary, accent, background }
    });
    // TODO: Save to backend API
    alert("Department settings saved (not yet persisted to backend).");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Admin: Department Settings</h2>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Department Name</label>
        <input
          className="w-full px-3 py-2 rounded border border-gray-300"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Department Logo</label>
        <input type="file" accept="image/*" onChange={handleLogoUpload} />
        {logoUrl && (
          <img src={logoUrl} alt="Logo Preview" className="mt-2 h-16 rounded border" />
        )}
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Primary Color</label>
        <input
          type="color"
          value={primary}
          onChange={e => setPrimary(e.target.value)}
          className="w-12 h-8 p-0 border-none"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Accent Color</label>
        <input
          type="color"
          value={accent}
          onChange={e => setAccent(e.target.value)}
          className="w-12 h-8 p-0 border-none"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Background Color</label>
        <input
          type="color"
          value={background}
          onChange={e => setBackground(e.target.value)}
          className="w-12 h-8 p-0 border-none"
        />
      </div>
      <button
        className="mt-4 px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        onClick={handleSave}
      >
        Save Settings
      </button>
    </div>
  );
};

export default AdminSettingsPage;