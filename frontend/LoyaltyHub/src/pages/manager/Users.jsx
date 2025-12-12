import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import PaginationControls from "../../components/PaginationControls";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const Users = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Data and pagination states
	const [users, setUsers] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Filter states
	const [showFilters, setShowFilters] = useState(false);
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [verified, setVerified] = useState("");
	const [activated, setActivated] = useState("");

	// Order-by states
	const [showOrderBy, setShowOrderBy] = useState(false);
	const [orderBy, setOrderBy] = useState("");

	// Fetch users when pagination or filters change
	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true);
			setError("");

			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				const params = new URLSearchParams();
				if (name) params.append("name", name);
				if (role) params.append("role", role);
				if (verified !== "") params.append("verified", verified);
				if (activated !== "") params.append("activated", activated);
				params.append("page", page.toString());
				params.append("limit", limit.toString());

				const res = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch users");
				}

				const data = await res.json();
				let fetchedUsers = data.results || [];

				// Apply frontend sorting if needed
				if (orderBy) {
					fetchedUsers = applyFrontendSorting(fetchedUsers);
				}

				setUsers(fetchedUsers);
				const totalCount = data.count || 0;
				setTotalPages(Math.max(1, Math.ceil(totalCount / limit)));
			} catch (err) {
				console.error("Failed to fetch users:", err);
				setError(err.message || "Failed to load users");
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, [page, limit, name, role, verified, activated, orderBy]);

	// Frontend sorting function
	const applyFrontendSorting = (data) => {
		const sorted = [...data];
		switch (orderBy) {
			case "name":
				return sorted.sort((a, b) => a.name.localeCompare(b.name));
			case "email":
				return sorted.sort((a, b) => a.email.localeCompare(b.email));
			case "role":
				return sorted.sort((a, b) => a.role.localeCompare(b.role));
			case "points":
				return sorted.sort((a, b) => (b.points || 0) - (a.points || 0));
			case "createdAt":
				return sorted.sort(
					(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
				);
			default:
				return sorted;
		}
	};

	const handleClearFilters = () => {
		setName("");
		setRole("");
		setVerified("");
		setActivated("");
		setPage(1);
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

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Users</h1>
					</div>
					<div className="card">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Users</h1>
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				{/* Filters */}
				<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "0.5rem"
						}}
					>
						<button
							className="button"
							onClick={() => setShowFilters(!showFilters)}
						>
							{showFilters ? "Hide Filters" : "Show Filters"}
						</button>
						{showFilters && (
							<button className="button" onClick={handleClearFilters}>
								Clear Filters
							</button>
						)}
					</div>

					{showFilters && (
						<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
							<input
								type="text"
								placeholder="Search by name or UtorId"
								className="input"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setPage(1);
								}}
							/>
							<select
								className="input"
								value={role}
								onChange={(e) => {
									setRole(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All Roles</option>
								<option value="regular">Regular</option>
								<option value="cashier">Cashier</option>
								<option value="manager">Manager</option>
								<option value="superuser">Superuser</option>
								<option value="event-organizer">Event Organizer</option>
							</select>
							<select
								className="input"
								value={verified}
								onChange={(e) => {
									setVerified(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All Verification Status</option>
								<option value="true">Verified</option>
								<option value="false">Not Verified</option>
							</select>
							<select
								className="input"
								value={activated}
								onChange={(e) => {
									setActivated(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All Activation Status</option>
								<option value="true">Activated (Has Logged In)</option>
								<option value="false">Not Activated</option>
							</select>
						</div>
					)}
				</div>

				{/* Order by */}
				<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "0.5rem"
						}}
					>
						<button
							className="button"
							onClick={() => setShowOrderBy(!showOrderBy)}
						>
							{showOrderBy ? "Hide Order By" : "Show Order By"}
						</button>
					</div>

					{showOrderBy && (
						<select
							className="input"
							value={orderBy}
							onChange={(e) => setOrderBy(e.target.value)}
						>
							<option value="">No Ordering</option>
							<option value="name">Name</option>
							<option value="email">Email</option>
							<option value="role">Role</option>
							<option value="points">Points (High to Low)</option>
							<option value="createdAt">Created Date (Newest First)</option>
						</select>
					)}
				</div>

				{/* Users List */}
				{users.length === 0 ? (
					<div className="card">No users found.</div>
				) : (
					users.map((userItem) => (
						<div
							key={userItem.id}
							className="card"
							style={{ cursor: "pointer" }}
							onClick={() => navigate(`/manager/users/${userItem.id}`)}
						>
							<div className="card-title">{userItem.name}</div>
							<div className="value" style={{ marginBottom: "0.5rem" }}>
								{userItem.email}
							</div>
							<div className="label">
								UtorId: {userItem.utorid} | Role: {getRoleDisplayName(userItem.role)} | Points:{" "}
								{(userItem.points || 0).toLocaleString()}
								{userItem.verified && " | ✓ Verified"}
								{userItem.lastLogin && " | ✓ Activated"}
							</div>
						</div>
					))
				)}

				{/* Pagination */}
				<PaginationControls
					page={page}
					totalPages={totalPages}
					setPage={setPage}
					limit={limit}
					setLimit={setLimit}
				/>

				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						Back to Home
					</button>
				</div>
			</div>
		</div>
	);
};

export default Users;

