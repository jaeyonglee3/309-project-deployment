import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const Transfer = () => {
	const navigate = useNavigate();
	const [recipientId, setRecipientId] = useState("");
	const [transferAmount, setTransferAmount] = useState("");
	const [remark, setRemark] = useState("");
	const [toast, setToast] = useState(null); // { type: "success" | "error", message: string }

	const { user } = useAuth();

	const API_BASE_URL =
		import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

	const showToast = (type, message) => {
		setToast({ type, message });
		setTimeout(() => setToast(null), 5000);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setRecipientId("");
		setTransferAmount("");
		setRemark("");

		const token = localStorage.getItem("token");

		try {
			let body = {
				type: "transfer",
				amount: Number(transferAmount)
			};

			// Only include remark if not empty
			if (remark.trim() !== "") {
				body.remark = remark.trim();
			}

			if (transferAmount <= 0) {
				showToast(
					"error",
					"Your transfer amount must be a positive integer value."
				);
				return;
			}

			if (transferAmount > user.points) {
				showToast(
					"error",
					"You do not have enough points to complete this transfer."
				);
				return;
			}

			const res = await fetch(
				`${API_BASE_URL}/users/${recipientId}/transactions`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: token ? `Bearer ${token}` : ""
					},
					body: JSON.stringify(body)
				}
			);

			// Handle response codes
			if (res.status === 201) {
				showToast("success", "Transfer successful!");
				setRecipientId("");
				setTransferAmount("");
				setRemark("");
				return;
			}

			if (res.status === 400) {
				showToast(
					"error",
					`Bad Request - user with ID '${recipientId}' not found.`
				);
				return;
			}

			if (res.status === 403) {
				showToast("error", "Your account must be verified to transfer points.");
				return;
			}

			// Other unexpected status
			showToast("error", `Unexpected error (${res.status}). Please try again.`);
		} catch (err) {
			console.error("Transfer request failed:", err);
			showToast("error", "Network error. Please try again.");
		}
	};

	return (
		<div className="page-container">
			{/* Toast Message */}
			{toast && (
				<div className={`toast toast-${toast.type}`}>{toast.message}</div>
			)}

			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Transfer Points</h1>
				</div>

				<div className="points-card">
					<div className="points-label">Current Balance</div>
					<div className="points-value">{user.points.toLocaleString()}</div>
					<div
						style={{
							fontSize: "0.875rem",
							color: "rgba(255, 255, 255, 0.8)",
							marginTop: "0.5rem"
						}}
					>
						points
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					{/* Recipient User ID */}
					<div className="form-label">
						<label>Recipient User ID</label>
					</div>
					<input
						className="input"
						value={recipientId}
						onChange={(e) => setRecipientId(e.target.value)}
						required
					/>

					{/* Points Amount to Transfer */}
					<div className="form-label">
						<label>Amount to Transfer</label>
					</div>
					<input
						type="number"
						className="input"
						value={transferAmount}
						onChange={(e) => setTransferAmount(e.target.value)}
						required
						min="1"
					/>

					{/* Remark */}
					<div className="form-label">
						<label>Remark (Optional)</label>
					</div>
					<input
						className="input"
						value={remark}
						onChange={(e) => setRemark(e.target.value)}
					/>

					<div className="button-group">
						<button
							type="submit"
							className="button button-primary"
							disabled={!recipientId || !transferAmount}
						>
							Transfer
						</button>
						{/* Back to home button */}
						<div className="button-group">
							<button onClick={() => navigate("/")} className="button">
								← Back to Home
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Transfer;
