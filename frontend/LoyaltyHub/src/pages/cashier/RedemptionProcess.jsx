import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../shared.css";

const RedemptionProcess = () => {
	const navigate = useNavigate();
	const [transactionId, setTransactionId] = useState("");
	const [toast, setToast] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const API_BASE_URL =
		import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

	const showToast = (type, message) => {
		setToast({ type, message });
		setTimeout(() => setToast(null), 5000);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem("token");

		setIsSubmitting(true);

		try {
			const res = await fetch(
				`${API_BASE_URL}/transactions/${transactionId}/processed`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: token ? `Bearer ${token}` : ""
					},
					body: JSON.stringify({ processed: true })
				}
			);

			if (res.status === 200) {
				showToast("success", "Redemption processed successfully!");
				// Reset form
				setTransactionId("");
			} else if (res.status === 400) {
				const data = await res.json();
				showToast(
					"error",
					data.message ||
						"Invalid request. Transaction may not be a redemption or already processed."
				);
			} else if (res.status === 401) {
				showToast("error", "Unauthorized. Please log in again.");
				setTimeout(() => navigate("/login"), 1500);
			} else if (res.status === 404) {
				showToast(
					"error",
					"Transaction not found. Please check the transaction ID."
				);
			} else {
				const data = await res.json();
				showToast(
					"error",
					data.message || "An error occurred. Please try again."
				);
			}
		} catch (err) {
			console.error("Attempt to process redemption failed: ", err);
			showToast(
				"error",
				"Network error. Please check your connection and try again."
			);
		} finally {
			setIsSubmitting(false);
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
					<h1 className="page-title">Process Redemption</h1>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="button-group">
						{/* Transaction ID */}
						<div className="form-label">
							<label>Redemption Transaction ID</label>
						</div>
						<input
							className="input"
							value={transactionId}
							onChange={(e) => setTransactionId(e.target.value)}
							required
							disabled={isSubmitting}
						/>
						<button
							type="submit"
							className="button button-primary"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Processing..." : "Process Redemption"}
						</button>

						<div className="button-group">
							{/* Back to home button */}
							<button
								type="button"
								onClick={() => navigate("/")}
								className="button"
								disabled={isSubmitting}
							>
								← Back to Home
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default RedemptionProcess;
