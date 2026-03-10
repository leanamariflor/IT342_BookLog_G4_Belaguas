import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import api from "../api/axios";

const AdminPanel = ({ onLogout }) => {
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [status, setStatus] = useState("");

  const loadRoles = async () => {
    try {
      const response = await api.get("/admin/roles");
      setRoles(response.data || []);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to load roles.");
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setStatus("Role name is required.");
      return;
    }

    try {
      await api.post("/admin/roles", { roleName: newRoleName.trim() });
      setNewRoleName("");
      setStatus("Role created successfully.");
      await loadRoles();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to create role.");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activePage="admin" onLogout={onLogout} />

      <main style={{ flex: 1, padding: "30px", background: "#f3f4f6", minHeight: "100vh" }}>
        <h1 style={{ marginBottom: "16px" }}>Admin Panel</h1>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>Manage platform roles (admin only).</p>

        <section style={{ background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Create Role</h2>
          <form onSubmit={handleCreateRole} style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="ROLE_EDITOR"
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
            <button type="submit" style={{ padding: "10px 16px", border: "none", borderRadius: "8px", background: "#111", color: "#fff", cursor: "pointer" }}>
              Create
            </button>
          </form>
          {status && <p style={{ marginTop: "10px", color: "#111" }}>{status}</p>}
        </section>

        <section style={{ background: "#fff", borderRadius: "12px", padding: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Existing Roles</h2>
          {roles.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No roles found.</p>
          ) : (
            <ul>
              {roles.map((role) => (
                <li key={role.roleId}>{role.roleName}</li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPanel;
