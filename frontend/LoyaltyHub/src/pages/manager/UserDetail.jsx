import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const UserDetail = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user: currentUser } = useAuth();

	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [editMode, setEditMode] = useState(false);

	// Edit form states
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("");
	const [verified, setVerified] = useState(false);
	const [suspicious, setSuspicious] = useState(false);
	const [saving, setSaving] = useState(false);

	// Fetch user data
	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true);
			setError("");

			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`${API_BASE_URL}/users/${id}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch user");
				}

				const data = await res.json();
				setUser(data);
				setEmail(data.email || "");
				setRole(data.role || "");
				setVerified(data.verified || false);
				setSuspicious(data.suspicious || false);
			} catch (err) {
				console.error("Failed to fetch user:", err);
				setError(err.message || "Failed to load user");
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchUser();
		}
	}, [id]);

	const handleSave = async () => {
		setSaving(true);
		setError("");

		const token = localStorage.getItem("token");
		if (!token) {
			setError("Not authenticated");
			setSaving(false);
			return;
		}

		try {
			const updateData = {};
			if (email !== user.email) updateData.email = email;
			if (role !== user.role) updateData.role = role;
			if (verified !== user.verified) updateData.verified = verified;
			if (suspicious !== user.suspicious) updateData.suspicious = suspicious;

			if (Object.keys(updateData).length === 0) {
				setEditMode(false);
				setSaving(false);
				return;
			}

			const res = await fetch(`${API_BASE_URL}/users/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(updateData)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update user");
			}

			const updatedUser = await res.json();
			setUser(updatedUser);
			setEditMode(false);
		} catch (err) {
			console.error("Failed to update user:", err);
			setError(err.message || "Failed to update user");
		} finally {
			setSaving(false);
		}
	};

	const getRoleDisplayName = (role) => {
		const roleMap = {
			regular: "Regular",
			cashier: "Cashier",
			manager: "Manager",
			superuser: "Superuser",
			"event-organizer": "Event Organizer"
		};
		return roleMap[role] || role;
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
	};

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">User Details</h1>
					</div>
					<div className="card">Loading...</div>
				</div>
			</div>
		);
	}

	if (error && !user) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">User Details</h1>
					</div>
					<div className="card" style={{ color: "red" }}>
						{error}
					</div>
					<div className="button-group">
						<button onClick={() => navigate("/manager/users")} className="button">
							Back to Users
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const canEdit = currentUser && (currentUser.role === "manager" || currentUser.role === "superuser");

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">User Details</h1>
					{canEdit && !editMode && (
						<button
							className="button button-primary"
							onClick={() => setEditMode(true)}
							style={{ marginLeft: "1rem" }}
						>
							Edit User
						</button>
					)}
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				<div className="card">
					<div className="label">UtorId</div>
					<div className="value">{user.utorid}</div>
				</div>

				<div className="card">
					<div className="label">Name</div>
					<div className="value">{user.name}</div>
				</div>

				<div className="card">
					<div className="label">Email</div>
					{editMode ? (
						<input
							type="email"
							className="input"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					) : (
						<div className="value">{user.email || "N/A"}</div>
					)}
				</div>

				{user.birthday && (
					<div className="card">
						<div className="label">Birthday</div>
						<div className="value">{formatDate(user.birthday)}</div>
					</div>
				)}

				<div className="card">
					<div className="label">Role</div>
					{editMode && canEdit ? (
						<select
							className="input"
							value={role}
							onChange={(e) => setRole(e.target.value)}
						>
							<option value="regular">Regular</option>
							<option value="cashier">Cashier</option>
							<option value="manager">Manager</option>
							<option value="superuser">Superuser</option>
							<option value="event-organizer">Event Organizer</option>
						</select>
					) : (
						<div className="value">{getRoleDisplayName(user.role)}</div>
					)}
				</div>

				<div className="card">
					<div className="label">Points</div>
					<div className="value">{(user.points || 0).toLocaleString()}</div>
				</div>

				<div className="card">
					<div className="label">Member Since</div>
					<div className="value">{formatDate(user.createdAt)}</div>
				</div>

				{user.lastLogin && (
					<div className="card">
						<div className="label">Last Login</div>
						<div className="value">{formatDate(user.lastLogin)}</div>
					</div>
				)}

				<div className="card">
					<div className="label">Verified</div>
					{editMode && canEdit ? (
						<label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<input
								type="checkbox"
								checked={verified}
								onChange={(e) => setVerified(e.target.checked)}
							/>
							<span>Verified</span>
						</label>
					) : (
						<div className="value">{user.verified ? "✓ Yes" : "✗ No"}</div>
					)}
				</div>

				{user.suspicious !== undefined && (
					<div className="card">
						<div className="label">Suspicious</div>
						{editMode && canEdit ? (
							<label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
								<input
									type="checkbox"
									checked={suspicious}
									onChange={(e) => setSuspicious(e.target.checked)}
								/>
								<span>Mark as Suspicious</span>
							</label>
						) : (
							<div className="value" style={{ color: user.suspicious ? "red" : "inherit" }}>
								{user.suspicious ? "⚠ Yes" : "✓ No"}
							</div>
						)}
					</div>
				)}

				{user.avatarUrl && (
					<div className="card">
						<div className="label">Avatar</div>
						<div className="value">
							<img
								src={user.avatarUrl}
								alt="Avatar"
								style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px" }}
							/>
						</div>
					</div>
				)}

				{editMode && (
					<div className="button-group" style={{ marginTop: "1rem" }}>
						<button
							className="button button-primary"
							onClick={handleSave}
							disabled={saving}
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
						<button
							className="button"
							onClick={() => {
								setEditMode(false);
								setEmail(user.email || "");
								setRole(user.role || "");
								setVerified(user.verified || false);
								setSuspicious(user.suspicious || false);
								setError("");
							}}
							disabled={saving}
						>
							Cancel
						</button>
					</div>
				)}

				<div className="button-group">
					<button onClick={() => navigate("/manager/users")} className="button">
						Back to Users
					</button>
				</div>
			</div>
		</div>
	);
};

export default UserDetail;

