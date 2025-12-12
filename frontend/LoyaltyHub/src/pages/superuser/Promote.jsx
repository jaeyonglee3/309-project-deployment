import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const Promote = () => {
	const navigate = useNavigate();
	const { user: currentUser } = useAuth();
	const [userEmail, setUserEmail] = useState("");
	const [newRole, setNewRole] = useState("manager");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const roles = [
		{ value: "regular", label: "Regular" },
		{ value: "cashier", label: "Cashier" },
		{ value: "manager", label: "Manager" },
		{ value: "superuser", label: "Superuser" }
	];

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		const token = localStorage.getItem("token");
		if (!token) {
			setError("Not authenticated");
			setLoading(false);
			return;
		}

		try {
			// First, find user by email
			const searchRes = await fetch(
				`${API_BASE_URL}/users?name=${encodeURIComponent(userEmail)}&limit=100`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (!searchRes.ok) {
				throw new Error("Failed to search for user");
			}

			const searchData = await searchRes.json();
			const targetUser = searchData.results?.find(
				(u) => u.email.toLowerCase() === userEmail.toLowerCase()
			);

			if (!targetUser) {
				setError("User not found with that email address");
				setLoading(false);
				return;
			}

			// Update user role
			const updateRes = await fetch(`${API_BASE_URL}/users/${targetUser.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ role: newRole })
			});

			if (!updateRes.ok) {
				const data = await updateRes.json();
				throw new Error(data.error || "Failed to promote user");
			}

			setSuccess(
				`Successfully promoted ${targetUser.name} (${targetUser.utorid}) to ${roles.find((r) => r.value === newRole)?.label || newRole}`
			);
			setUserEmail("");
			setNewRole("manager");
		} catch (err) {
			console.error("Failed to promote user:", err);
			setError(err.message || "Failed to promote user");
		} finally {
			setLoading(false);
		}
	};

	if (!currentUser || (currentUser.role !== "superuser")) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Promote User</h1>
					</div>
					<div className="card" style={{ color: "red" }}>
						Access denied. Superuser role required.
					</div>
					<div className="button-group">
						<button onClick={() => navigate("/")} className="button">
							Back to Home
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Promote User</h1>
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				{success && (
					<div className="card" style={{ color: "green", marginBottom: "1rem" }}>
						{success}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>
							User Email
						</div>
						<input
							type="email"
							placeholder="Enter user email address"
							className="input"
							value={userEmail}
							onChange={(e) => setUserEmail(e.target.value)}
							required
							disabled={loading}
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>
							New Role
						</div>
						<select
							className="input"
							value={newRole}
							onChange={(e) => setNewRole(e.target.value)}
							disabled={loading}
						>
							{roles.map((role) => (
								<option key={role.value} value={role.value}>
									{role.label}
								</option>
							))}
						</select>
					</div>

					<div className="button-group">
						<button
							type="submit"
							className="button button-primary"
							disabled={loading}
						>
							{loading ? "Promoting..." : "Promote User"}
						</button>
						<button
							type="button"
							onClick={() => navigate("/")}
							className="button"
							disabled={loading}
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Promote;
