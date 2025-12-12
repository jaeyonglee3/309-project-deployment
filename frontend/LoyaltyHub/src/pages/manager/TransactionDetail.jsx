import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const TransactionDetail = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user } = useAuth();

	const [transaction, setTransaction] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [adjustmentAmount, setAdjustmentAmount] = useState("");
	const [adjustmentRemark, setAdjustmentRemark] = useState("");
	const [creatingAdjustment, setCreatingAdjustment] = useState(false);
	const [markingSuspicious, setMarkingSuspicious] = useState(false);

	useEffect(() => {
		const fetchTransaction = async () => {
			setLoading(true);
			setError("");

			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch transaction");
				}

				const data = await res.json();
				setTransaction(data);
			} catch (err) {
				console.error("Failed to fetch transaction:", err);
				setError(err.message || "Failed to load transaction");
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchTransaction();
		}
	}, [id]);

	const handleMarkSuspicious = async (suspicious) => {
		setMarkingSuspicious(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/transactions/${id}/suspicious`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ suspicious })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update transaction");
			}

			// Refresh transaction data
			const updatedRes = await fetch(`${API_BASE_URL}/transactions/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const updatedData = await updatedRes.json();
			setTransaction(updatedData);
		} catch (err) {
			console.error("Failed to mark suspicious:", err);
			setError(err.message || "Failed to update transaction");
		} finally {
			setMarkingSuspicious(false);
		}
	};

	const handleCreateAdjustment = async (e) => {
		e.preventDefault();
		setCreatingAdjustment(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const amountNum = parseFloat(adjustmentAmount);
			if (isNaN(amountNum) || amountNum === 0) {
				throw new Error("Invalid adjustment amount");
			}

			const res = await fetch(`${API_BASE_URL}/transactions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					utorid: transaction.utorid,
					type: "adjustment",
					amount: amountNum,
					relatedId: parseInt(id),
					remark: adjustmentRemark || `Adjustment for transaction ${id}`
				})
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to create adjustment");
			}

			// Reset form and refresh
			setAdjustmentAmount("");
			setAdjustmentRemark("");
			const updatedRes = await fetch(`${API_BASE_URL}/transactions/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const updatedData = await updatedRes.json();
			setTransaction(updatedData);
		} catch (err) {
			console.error("Failed to create adjustment:", err);
			setError(err.message || "Failed to create adjustment");
		} finally {
			setCreatingAdjustment(false);
		}
	};

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Transaction Details</h1>
					</div>
					<div className="card">Loading...</div>
				</div>
			</div>
		);
	}

	if (error && !transaction) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Transaction Details</h1>
					</div>
					<div className="card" style={{ color: "red" }}>
						{error}
					</div>
					<div className="button-group">
						<button onClick={() => navigate("/manager/transactions")} className="button">
							Back to Transactions
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!transaction) {
		return null;
	}

	const canManage = user && (user.role === "manager" || user.role === "superuser");

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Transaction Details</h1>
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				<div className="card">
					<div className="label">Transaction ID</div>
					<div className="value">{transaction.id}</div>
				</div>

				<div className="card">
					<div className="label">User UtorId</div>
					<div className="value">{transaction.utorid}</div>
				</div>

				<div className="card">
					<div className="label">Type</div>
					<div className="value">
						{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
					</div>
				</div>

				<div className="card">
					<div className="label">Amount (Points)</div>
					<div className="value">
						{transaction.amount > 0 ? "+" : ""} {transaction.amount} points
					</div>
				</div>

				{transaction.type === "purchase" && transaction.spent !== undefined && (
					<div className="card">
						<div className="label">Amount Spent</div>
						<div className="value">${transaction.spent}</div>
					</div>
				)}

				{transaction.type === "purchase" && transaction.suspicious !== undefined && (
					<div className="card">
						<div className="label">Suspicious</div>
						<div className="value" style={{ color: transaction.suspicious ? "red" : "inherit" }}>
							{transaction.suspicious ? "⚠ Yes" : "✓ No"}
						</div>
					</div>
				)}

				{transaction.createdBy && (
					<div className="card">
						<div className="label">Created By</div>
						<div className="value">{transaction.createdBy}</div>
					</div>
				)}

				{transaction.promotionIds && transaction.promotionIds.length > 0 && (
					<div className="card">
						<div className="label">Promotion IDs</div>
						<div className="value">{transaction.promotionIds.join(", ")}</div>
					</div>
				)}

				{transaction.remark && (
					<div className="card">
						<div className="label">Remark</div>
						<div className="value">{transaction.remark}</div>
					</div>
				)}

				{canManage && transaction.type === "purchase" && (
					<div className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>
							Mark as Suspicious
						</div>
						<div className="button-group">
							<button
								className="button"
								onClick={() => handleMarkSuspicious(!transaction.suspicious)}
								disabled={markingSuspicious}
							>
								{markingSuspicious
									? "Updating..."
									: transaction.suspicious
									? "Mark as Not Suspicious"
									: "Mark as Suspicious"}
							</button>
						</div>
					</div>
				)}

				{canManage && (
					<div className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>
							Create Adjustment Transaction
						</div>
						<form onSubmit={handleCreateAdjustment}>
							<input
								type="number"
								step="0.01"
								className="input"
								placeholder="Adjustment amount (positive or negative)"
								value={adjustmentAmount}
								onChange={(e) => setAdjustmentAmount(e.target.value)}
								required
								style={{ marginBottom: "0.5rem" }}
							/>
							<input
								type="text"
								className="input"
								placeholder="Remark (optional)"
								value={adjustmentRemark}
								onChange={(e) => setAdjustmentRemark(e.target.value)}
								style={{ marginBottom: "0.5rem" }}
							/>
							<div className="button-group">
								<button
									type="submit"
									className="button button-primary"
									disabled={creatingAdjustment}
								>
									{creatingAdjustment ? "Creating..." : "Create Adjustment"}
								</button>
							</div>
						</form>
					</div>
				)}

				<div className="button-group">
					<button onClick={() => navigate("/manager/transactions")} className="button">
						Back to Transactions
					</button>
				</div>
			</div>
		</div>
	);
};

export default TransactionDetail;

