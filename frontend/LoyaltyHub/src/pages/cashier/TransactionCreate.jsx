import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../shared.css";

const TransactionCreate = () => {
	const navigate = useNavigate();
	const [userId, setUserId] = useState("");
	const [amount, setAmount] = useState("");
	const [remark, setRemark] = useState("");
	const [promotionIds, setPromotionIds] = useState("");
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

		// Validate amount is positive
		const amountValue = parseFloat(amount);
		if (amountValue <= 0) {
			showToast("error", "Amount must be greater than 0");
			return;
		}

		// Parse promotion IDs
		const promotionIdsArray = promotionIds
			.trim()
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id !== "")
			.map((id) => parseInt(id, 10));

		// Validate promotion IDs are valid numbers
		if (promotionIds.trim() && promotionIdsArray.some((id) => isNaN(id))) {
			showToast(
				"error",
				"Promotion IDs must be valid numbers separated by commas"
			);
			return;
		}

		setIsSubmitting(true);

		try {
			const body = {
				utorid: userId,
				type: "purchase",
				spent: amountValue,
				promotionIds: promotionIdsArray
			};

			if (remark.trim()) {
				body.remark = remark.trim();
			}

			const res = await fetch(`${API_BASE_URL}/transactions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: token ? `Bearer ${token}` : ""
				},
				body: JSON.stringify(body)
			});

			if (res.status === 201) {
				showToast("success", "Transaction created successfully!");
				// Reset form
				setUserId("");
				setAmount("");
				setRemark("");
				setPromotionIds("");
			} else if (res.status === 400) {
				const data = await res.json();
				showToast(
					"error",
					data.message || "Invalid request. Ensure all promotion IDs are valid"
				);
			} else if (res.status === 401) {
				showToast("error", "Unauthorized. Please log in again.");
				setTimeout(() => navigate("/login"), 1500);
			} else if (res.status === 404) {
				showToast("error", "User not found. Please check the UtorId.");
			} else {
				const data = await res.json();
				showToast(
					"error",
					data.message || "An error occurred. Please try again."
				);
			}
		} catch (err) {
			console.error("Attempt to create purchase transaction failed: ", err);
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
					<h1 className="page-title">Create Purchase Transaction</h1>
				</div>

				<form onSubmit={handleSubmit}>
					{/* UtorId */}
					<div className="form-label">
						<label>UtorId</label>
					</div>
					<input
						className="input"
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
						required
						disabled={isSubmitting}
					/>
					{/* Amount Spent */}
					<div className="form-label">
						<label>Dollar Amount Spent</label>
					</div>
					<input
						type="number"
						step="0.01"
						min="0.01"
						className="input"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						required
						disabled={isSubmitting}
					/>

					{/* Promotion IDs */}
					<div className="form-label">
						<label>Promotion IDs (Optional)</label>
					</div>
					<input
						className="input"
						placeholder="e.g., 1, 2, 3"
						value={promotionIds}
						onChange={(e) => setPromotionIds(e.target.value)}
						disabled={isSubmitting}
					/>

					{/* Remark */}
					<div className="form-label">
						<label>Remark (Optional)</label>
					</div>
					<input
						className="input"
						value={remark}
						onChange={(e) => setRemark(e.target.value)}
						disabled={isSubmitting}
					/>

					{/* Submit button */}
					<div className="button-group">
						<button
							type="submit"
							className="button button-primary"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Creating..." : "Create Purchase Transaction"}
						</button>
					</div>

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
				</form>
			</div>
		</div>
	);
};

export default TransactionCreate;
