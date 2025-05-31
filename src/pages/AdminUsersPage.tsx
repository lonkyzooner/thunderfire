import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { useAuth } from "../contexts/DevAuthContext";
import { useNavigate } from "react-router-dom";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "officer" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/"); // Only allow admins
      return;
    }
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load users");
        setLoading(false);
      });
  }, [user, navigate]);

  const handleCreateUser = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error("Failed to create user");
      const data = await res.json();
      setUsers(prev => [...prev, data.user]);
      setShowCreate(false);
      setNewUser({ name: "", email: "", role: "officer" });
    } catch {
      setError("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <Button onClick={() => setShowCreate(true)} className="mb-4">Create User</Button>
      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Card>
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td className="px-4 py-2">{u.name || "-"}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">
                    {/* Edit and Delete actions can be added here */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogTitle>Create New User</DialogTitle>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Name"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            />
            <select
              className="border rounded px-2 py-1"
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;