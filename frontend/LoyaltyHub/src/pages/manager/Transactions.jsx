import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import PaginationControls from "../../components/PaginationControls";
import "../../shared.css";
import "../user/Transactions.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const Transactions = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Data and pagination states
	const [transactions, setTransactions] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState("");

	// Filter states
	const [showFilters, setShowFilters] = useState(false);
	const [name, setName] = useState("");
	const [createdBy, setCreatedBy] = useState("");
	const [suspicious, setSuspicious] = useState("");
	const [type, setType] = useState("");
	const [promotionId, setPromotionId] = useState("");
	const [amount, setAmount] = useState("");
	const [operator, setOperator] = useState("");

	// Order-by states
	const [showOrderBy, setShowOrderBy] = useState(false);
	const [orderBy, setOrderBy] = useState("");

	// Related Users (for transfer transactions)
	const [relatedUsers, setRelatedUsers] = useState({});

	const fetchRelatedUser = useCallback(
		async (userId) => {
			if (!userId) return;
			const token = localStorage.getItem("token");

			if (relatedUsers[userId]) return;

			try {
				const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
					headers: {
						Authorization: token ? `Bearer ${token}` : ""
					}
				});
				const data = await res.json();

				setRelatedUsers((prev) => ({
					...prev,
					[userId]: data
				}));
			} catch (err) {
				console.error("Failed to fetch related user", err);
			}
		},
		[relatedUsers]
	);

	useEffect(() => {
		transactions.forEach((tx) => {
			if (tx.type === "transfer" && tx.relatedId) {
				fetchRelatedUser(tx.relatedId);
			}
		});
	}, [transactions, fetchRelatedUser]);

	// Sorting for order-by
	const applyFrontendSorting = useCallback(
		(data) => {
			if (orderBy === "amount") {
				return [...data].sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
			}

			if (orderBy === "type") {
				return [...data].sort((a, b) =>
					a.type.localeCompare(b.type, "en", { sensitivity: "base" })
				);
			}

			return data;
		},
		[orderBy]
	);

	// Fetch data when pagination or filters change
	useEffect(() => {
		const buildQueryString = () => {
			const params = new URLSearchParams();

			if (name) params.append("name", name);
			if (createdBy) params.append("createdBy", createdBy);
			if (suspicious !== "") params.append("suspicious", suspicious);
			if (type) params.append("type", type);
			if (promotionId) params.append("promotionId", Number(promotionId));
			if (amount) {
				params.append("amount", Number(amount));
				if (operator) params.append("operator", operator);
			}

			params.append("page", page);
			params.append("limit", limit);

			return params.toString();
		};

		const fetchTransactions = async () => {
			const token = localStorage.getItem("token");

			try {
				const qs = buildQueryString();
				const res = await fetch(`${API_BASE_URL}/transactions?${qs}`, {
					headers: {
						Authorization: token ? `Bearer ${token}` : ""
					}
				});

				if (!res.ok) {
					setError(`Failed to fetch transactions (${res.status})`);
					return;
				}

				const data = await res.json();
				setError("");

				let results = data.results || [];
				results = applyFrontendSorting(results);

				setTransactions(results);
				setTotalPages(Math.ceil(data.count / limit) || 1);
			} catch (err) {
				console.error(err);
				setError("Network error fetching transactions.");
			}
		};
		fetchTransactions();
	}, [
		page,
		name,
		createdBy,
		suspicious,
		type,
		promotionId,
		amount,
		operator,
		limit,
		orderBy,
		applyFrontendSorting
	]);

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">All Transactions</h1>
				</div>

				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						← Back to Home
					</button>
				</div>

				{/* Filters */}
				<div className="card" style={{ padding: "1rem" }}>
					<div
						className="label"
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						}}
					>
						<span>Filters</span>

						<button
							className="filter-toggle"
							onClick={() => setShowFilters((s) => !s)}
						>
							{showFilters ? "Hide ▲" : "Show ▼"}
						</button>
					</div>

					<div className={`filters-content ${showFilters ? "open" : ""}`}>
						<div style={{ marginTop: "0.75rem" }}>
							<div className="form-label">
								<label>User Name/UtorId</label>
							</div>
							<input
								className="input"
								type="text"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setPage(1);
								}}
								placeholder="Search by name or UtorId"
							/>

							<div className="form-label">
								<label>Created By (UtorId)</label>
							</div>
							<input
								className="input"
								type="text"
								value={createdBy}
								onChange={(e) => {
									setCreatedBy(e.target.value);
									setPage(1);
								}}
								placeholder="UtorId of creator"
							/>

							<div className="form-label">
								<label>Suspicious</label>
							</div>
							<select
								className="input"
								value={suspicious}
								onChange={(e) => {
									setSuspicious(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All</option>
								<option value="true">Suspicious Only</option>
								<option value="false">Not Suspicious</option>
							</select>

							<div className="form-label">
								<label>Transaction Type</label>
							</div>
							<select
								className="input"
								value={type}
								onChange={(e) => {
									setType(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All</option>
								<option value="purchase">Purchase</option>
								<option value="redemption">Redemption</option>
								<option value="adjustment">Adjustment</option>
								<option value="event">Event</option>
								<option value="transfer">Transfer</option>
							</select>

							<div className="form-label">
								<label>Promotion ID</label>
							</div>
							<input
								className="input"
								type="number"
								value={promotionId}
								onChange={(e) => {
									setPromotionId(e.target.value);
									setPage(1);
								}}
								placeholder="Optional"
							/>

							<div className="amount-row">
								<div className="amount-field">
									<div className="form-label">
										<label>Amount</label>
									</div>
									<input
										className="input"
										type="number"
										value={amount}
										onChange={(e) => {
											const val = e.target.value;
											setAmount(val);
											setPage(1);
											if (val && !operator) {
												setOperator("gte");
											}
											if (!val) {
												setOperator("");
											}
										}}
										placeholder="Optional"
									/>
								</div>

								{amount && (
									<div className="operator-field">
										<div className="form-label">
											<label>Operator</label>
										</div>
										<select
											className="input"
											value={operator}
											onChange={(e) => {
												setOperator(e.target.value);
												setPage(1);
											}}
										>
											<option value="gte">≥</option>
											<option value="lte">≤</option>
										</select>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Order by */}
				<div className="card" style={{ padding: "1rem" }}>
					<div
						className="label"
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						}}
					>
						<span>Order Results By</span>

						<button
							className="filter-toggle"
							onClick={() => setShowOrderBy((s) => !s)}
						>
							{showOrderBy ? "Hide ▲" : "Show ▼"}
						</button>
					</div>

					<div className={`filters-content ${showOrderBy ? "open" : ""}`}>
						<select
							className="input"
							value={orderBy}
							onChange={(e) => setOrderBy(e.target.value)}
						>
							<option value="">No Ordering</option>
							<option value="amount">Amount</option>
							<option value="type">Type</option>
						</select>
					</div>
				</div>

				{error && <div className="error-message">{error}</div>}

				{/* List of Transactions */}
				<div className="card">
					<div className="label">Results</div>

					{transactions?.length === 0 && (
						<div className="label">0 results found</div>
					)}

					{transactions.map((tx) => (
						<div key={tx.id} className="list-item">
							<div
								className={`card card-${tx.type}`}
								style={{ cursor: "pointer" }}
								onClick={() => navigate(`/manager/transactions/${tx.id}`)}
							>
								<div className="card-title">
									{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
								</div>

								<div className="label">
									User: {tx.utorid} | Created By: {tx.createdBy}
								</div>

								{tx.type === "purchase" && (
									<>
										{tx.spent && (
											<div className="label">Amount Spent: ${tx.spent}</div>
										)}
										{tx.suspicious && (
											<div className="label" style={{ color: "red" }}>
												⚠ Suspicious Transaction
											</div>
										)}
									</>
								)}

								{tx?.promotionIds?.length > 0 && (
									<div className="label">
										Promotion ID(s): {tx.promotionIds.join(", ")}
									</div>
								)}

								{tx?.remark && (
									<div className="label">Remark: {tx.remark}</div>
								)}

								{tx.type === "redemption" && (
									<div className="label">
										Status: {tx?.relatedId ? "Processed" : "Pending"}
									</div>
								)}

								{tx.type === "adjustment" && tx?.relatedId && (
									<div className="label">
										Related Transaction ID: {tx.relatedId}
										{tx.suspicious && (
											<span style={{ color: "red", marginLeft: "0.5rem" }}>
												⚠ Suspicious
											</span>
										)}
									</div>
								)}

								{tx.type === "transfer" && tx?.relatedId && (
									<div className="label">
										{tx.amount < 0 ? "Recipient" : "Sender"} utorid:{" "}
										{relatedUsers[tx.relatedId]?.utorid || "Loading..."}
									</div>
								)}

								{tx.type === "event" && tx?.relatedId && (
									<div className="label">Event ID: {tx.relatedId}</div>
								)}

								<div className="value">
									{tx?.amount > 0 ? "+" : ""} {tx.amount} points
								</div>
							</div>
						</div>
					))}
				</div>

				{transactions?.length !== 0 && (
					<PaginationControls
						page={page}
						totalPages={totalPages}
						setPage={setPage}
						limit={limit}
						setLimit={setLimit}
					/>
				)}
			</div>
		</div>
	);
};

export default Transactions;

