import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import "../shared.css";

const RedemptionRequest = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const API_BASE_URL =
		import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

	// States
	const [amount, setAmount] = useState();
	const [remark, setRemark] = useState("");
	const [toast, setToast] = useState(null);

	const showToast = (type, message) => {
		setToast({ type, message });
		setTimeout(() => setToast(null), 5000);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setAmount("");

		const token = localStorage.getItem("token");

		try {
			let body = {
				type: "redemption",
				amount: Number(amount)
			};

			// Only include remark if not empty
			if (remark.trim() !== "") {
				body.remark = remark.trim();
			}

			if (amount <= 0) {
				showToast(
					"error",
					"Your requested redemption amount must be a positive integer value."
				);
				return;
			}

			if (amount > user.points) {
				showToast(
					"error",
					"Your requested redemption amount exceeds your current points balance."
				);
				return;
			}

			const res = await fetch(`${API_BASE_URL}/users/me/transactions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: token ? `Bearer ${token}` : ""
				},
				body: JSON.stringify(body)
			});

			// Handle response codes
			if (res.status === 201) {
				showToast("success", "Redemption request successfully created!");
				setAmount("");
				setRemark("");
				return;
			}

			if (res.status === 400) {
				showToast("error", `Bad Request`);
				return;
			}

			if (res.status === 403) {
				showToast(
					"error",
					"Your account must be verified to create a point redemption request."
				);
				return;
			}

			// Other unexpected status
			showToast("error", `Unexpected error (${res.status}). Please try again.`);
		} catch (err) {
			console.error("Point redemption request creation failed:", err);
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
					<h1 className="page-title">Point Redemption Request</h1>
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
					{/* Points Amount to Redeem */}
					<div className="form-label">
						<label>Amount to Redeem</label>
					</div>
					<input
						type="number"
						className="input"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						required
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
						{/* Submit button */}
						<button
							onClick={handleSubmit}
							className="button button-primary"
							disabled={amount <= 0 || amount === undefined}
						>
							Submit Request
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

export default RedemptionRequest;
