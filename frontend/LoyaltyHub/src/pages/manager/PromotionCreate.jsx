import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const PromotionCreate = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState("automatic");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [minSpending, setMinSpending] = useState("");
	const [rate, setRate] = useState("");
	const [points, setPoints] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const token = localStorage.getItem("token");
		if (!token) {
			setError("Not authenticated");
			setLoading(false);
			return;
		}

		try {
			const payload = {
				name,
				description,
				type,
				startTime: new Date(startTime).toISOString(),
				endTime: new Date(endTime).toISOString()
			};

			if (minSpending) payload.minSpending = parseFloat(minSpending);
			if (rate) payload.rate = parseFloat(rate);
			if (points) payload.points = parseInt(points);

			const res = await fetch(`${API_BASE_URL}/promotions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to create promotion");
			}

			navigate("/manager/promotions");
		} catch (err) {
			console.error("Failed to create promotion:", err);
			setError(err.message || "Failed to create promotion");
		} finally {
			setLoading(false);
		}
	};

	if (!user || (user.role !== "manager" && user.role !== "superuser")) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Create Promotion</h1>
					</div>
					<div className="card" style={{ color: "red" }}>
						Access denied. Manager or Superuser role required.
					</div>
					<div className="button-group">
						<button onClick={() => navigate("/")} className="button">
							Back to Home
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Create Promotion</h1>
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Name *</div>
						<input
							type="text"
							className="input"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Description *</div>
						<textarea
							className="input"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							required
							rows={4}
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Type *</div>
						<select
							className="input"
							value={type}
							onChange={(e) => setType(e.target.value)}
							required
						>
							<option value="automatic">Automatic</option>
							<option value="one-time">One-Time</option>
						</select>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Start Time *</div>
						<input
							type="datetime-local"
							className="input"
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
							required
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>End Time *</div>
						<input
							type="datetime-local"
							className="input"
							value={endTime}
							onChange={(e) => setEndTime(e.target.value)}
							required
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Min Spending (Optional)</div>
						<input
							type="number"
							step="0.01"
							className="input"
							value={minSpending}
							onChange={(e) => setMinSpending(e.target.value)}
							placeholder="Minimum spending amount"
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Rate (Optional)</div>
						<input
							type="number"
							step="0.01"
							className="input"
							value={rate}
							onChange={(e) => setRate(e.target.value)}
							placeholder="Promotional rate (e.g., 0.01 for 1%)"
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Points (Optional)</div>
						<input
							type="number"
							className="input"
							value={points}
							onChange={(e) => setPoints(e.target.value)}
							placeholder="Promotional points"
						/>
					</div>

					<div className="button-group">
						<button
							type="submit"
							className="button button-primary"
							disabled={loading}
						>
							{loading ? "Creating..." : "Create Promotion"}
						</button>
						<button
							type="button"
							onClick={() => navigate("/manager/promotions")}
							className="button"
							disabled={loading}
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default PromotionCreate;
