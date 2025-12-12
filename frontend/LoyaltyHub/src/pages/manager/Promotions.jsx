import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import PaginationControls from "../../components/PaginationControls";
import "../../shared.css";
import "../user/Promotions.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const Promotions = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [promotions, setPromotions] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Filter states
	const [showFilters, setShowFilters] = useState(false);
	const [name, setName] = useState("");
	const [type, setType] = useState("");
	const [started, setStarted] = useState("");
	const [ended, setEnded] = useState("");

	useEffect(() => {
		const fetchPromotions = async () => {
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
				if (type) params.append("type", type);
				if (started !== "") params.append("started", started);
				if (ended !== "") params.append("ended", ended);
				params.append("page", page.toString());
				params.append("limit", limit.toString());

				const res = await fetch(`${API_BASE_URL}/promotions?${params.toString()}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch promotions");
				}

				const data = await res.json();
				setPromotions(data.results || []);
				const totalCount = data.count || 0;
				setTotalPages(Math.max(1, Math.ceil(totalCount / limit)));
			} catch (err) {
				console.error("Failed to fetch promotions:", err);
				setError(err.message || "Failed to load promotions");
			} finally {
				setLoading(false);
			}
		};

		fetchPromotions();
	}, [page, limit, name, type, started, ended]);

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	const getPromotionStatus = (promo) => {
		const now = new Date();
		const start = new Date(promo.startTime);
		const end = new Date(promo.endTime);

		if (now < start) return "Upcoming";
		if (now > end) return "Ended";
		return "Active";
	};

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Promotions</h1>
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
					<h1 className="page-title">Promotions</h1>
					{(user?.role === "manager" || user?.role === "superuser") && (
						<button
							onClick={() => navigate("/manager/promotions/create")}
							className="button button-primary"
							style={{ marginLeft: "1rem" }}
						>
							Create Promotion
						</button>
					)}
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
					</div>

					{showFilters && (
						<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
							<input
								type="text"
								placeholder="Search by name"
								className="input"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setPage(1);
								}}
							/>
							<select
								className="input"
								value={type}
								onChange={(e) => {
									setType(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All Types</option>
								<option value="automatic">Automatic</option>
								<option value="onetime">One-Time</option>
							</select>
							<select
								className="input"
								value={started}
								onChange={(e) => {
									setStarted(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All Start Status</option>
								<option value="true">Started</option>
								<option value="false">Not Started</option>
							</select>
							<select
								className="input"
								value={ended}
								onChange={(e) => {
									setEnded(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All End Status</option>
								<option value="true">Ended</option>
								<option value="false">Not Ended</option>
							</select>
						</div>
					)}
				</div>

				{/* Promotions List */}
				{promotions.length === 0 ? (
					<div className="card">No promotions found.</div>
				) : (
					promotions.map((promo) => (
						<div
							key={promo.id}
							className="card"
							style={{ cursor: "pointer" }}
							onClick={() => navigate(`/manager/promotions/${promo.id}`)}
						>
							<div className="card-title">{promo.name}</div>
							<div className="label" style={{ marginBottom: "0.5rem" }}>
								Type: {promo.type} | Status: {getPromotionStatus(promo)}
							</div>
							<div className="label">
								Start: {formatDate(promo.startTime)} | End: {formatDate(promo.endTime)}
							</div>
							{promo.minSpending && (
								<div className="label">Min Spending: ${promo.minSpending}</div>
							)}
							{promo.rate && (
								<div className="label">Rate: {promo.rate * 100}%</div>
							)}
							{promo.points && (
								<div className="label">Points: {promo.points}</div>
							)}
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

export default Promotions;
