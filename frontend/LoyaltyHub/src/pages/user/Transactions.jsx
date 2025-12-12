import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import PaginationControls from "../../components/PaginationControls";
import "../../shared.css";
import "./Transactions.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const Transactions = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Data and pagination states
	const [transactions, setTransactions] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(3);
	const [totalPages, setTotalPages] = useState(1);

	// Filter states
	const [showFilters, setShowFilters] = useState(false);
	const [type, setType] = useState("");
	const [promotionId, setPromotionId] = useState("");
	const [amount, setAmount] = useState("");
	const [operator, setOperator] = useState("");

	// Order-by states
	const [showOrderBy, setShowOrderBy] = useState(false);
	const [orderBy, setOrderBy] = useState("amount");
	const [error, setError] = useState("");

	// Related Users (relatedIds)
	const [relatedUsers, setRelatedUsers] = useState({});

	const fetchRelatedUser = useCallback(
		async (userId) => {
			if (!userId) return;
			const token = localStorage.getItem("token");

			// Don’t fetch again if we already have the user cached
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
		if (user.role == "regular") {
			// Cashier and above required to fetch user data
			// Thus, unable to fetch utorids for transfer transactions
			return;
		}
		transactions.forEach((tx) => {
			if (tx.type === "transfer" && tx.relatedId) {
				fetchRelatedUser(tx.relatedId);
			}
		});
	}, [transactions, fetchRelatedUser, user.role]);

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
				const res = await fetch(`${API_BASE_URL}/users/me/transactions?${qs}`, {
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
					<h1 className="page-title">Transactions</h1>
				</div>

				{/* Back to home button */}
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

					{/* Collapsible content */}
					<div className={`filters-content ${showFilters ? "open" : ""}`}>
						<div style={{ marginTop: "0.75rem" }}>
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

											// If user starts typing, auto-select gte
											if (val && !operator) {
												setOperator("gte");
											}

											// If user clears input, hide operator
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
				{/* Note: Frontend ordering is applied to the transactions currently loaded on the page */}
				{/* The API does not support server-side ordering, so sorting is limited to the current page's data */}
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
							<option value="amount">Amount</option>
							<option value="type">Type</option>
						</select>
					</div>
				</div>

				{error && <div className="error-message">{error}</div>}

				{/* List of Transactions */}
				<div className="card">
					<div className="label">Results</div>

					{transactions?.length == 0 && (
						<div className="label">0 results found</div>
					)}

					{/* each tx has an id, type, spent, amount, promotionIds, remark, createdBy */}
					{/* types include: purchase, redemption, adjustment, event, transfer */}
					{transactions.map((tx) => (
						<div key={tx.id} className="list-item">
							<div key={tx.id} className={`card card-${tx.type}`}>
								{/* type label */}
								<div className="card-title">
									{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
								</div>

								{/* created by label */}
								<div className="label">
									{"Created By"}: {tx.createdBy}
								</div>

								{/* amount spent, if type is purchase */}
								{tx.type === "purchase" && (
									<div className="label">{"Amount Spent: $" + tx.spent}</div>
								)}

								{/* promotion ids, if any */}
								{tx?.promotionIds?.length > 0 && (
									<>
										<div className="label">
											Promotion ID(s): {tx.promotionIds.join(", ")}
										</div>
									</>
								)}

								{/* remarks, if any */}
								{tx?.remark && (
									<div className="label">{"Remark: " + tx.remark}</div>
								)}

								{/* if redemption transaction, display whether it has been processed yet */}
								{tx.type === "redemption" && (
									<div className="label">{`Status: ${
										tx?.relatedId ? "Processed Successfully" : "Processing"
									}`}</div>
								)}

								{/* relatedId */}
								{tx.type !== "purchase" && (
									<>
										{tx.type === "adjustment" && (
											<div className="label">
												{"Related Transaction ID: " + tx.relatedId}
											</div>
										)}

										{/* can only show utorid if role is >= cashier */}
										{tx.type === "transfer" &&
											tx?.relatedId &&
											user.role !== "regular" && (
												<div className="label">
													{tx.amount < 0 ? "Recipient" : "Sender"}
													{" utorid: "}
													{relatedUsers[tx.relatedId]?.utorid || "Loading..."}
												</div>
											)}

										{/* the user ID of the cashier who processed the redemption */}
										{/* can be null if redemption has not been processed yet */}
										{tx.type === "redemption" && tx?.relatedId && (
											<div className="label">
												{"Cashier ID: " + tx.relatedId}
											</div>
										)}

										{tx.type === "event" && tx?.relatedId && (
											<div className="label">{"Event ID: " + tx.relatedId}</div>
										)}
									</>
								)}

								{/* +/- points amount */}
								<div className="value">
									{tx?.amount > 0 ? "+" : ""} {tx.amount} points
								</div>

								{tx.type === "redemption" && tx?.relatedId === undefined && (
									<button
										className="qr-code-button button"
										onClick={() => navigate(`/user/redemption/${tx.id}/qr`)}
									>
										QR Code for Processing →
									</button>
								)}
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
