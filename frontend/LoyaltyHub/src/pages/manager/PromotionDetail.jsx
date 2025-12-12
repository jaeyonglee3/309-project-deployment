import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const PromotionDetail = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user } = useAuth();

	const [promotion, setPromotion] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [editMode, setEditMode] = useState(false);
	const [saving, setSaving] = useState(false);

	// Edit form states
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [minSpending, setMinSpending] = useState("");
	const [rate, setRate] = useState("");
	const [points, setPoints] = useState("");

	useEffect(() => {
		const fetchPromotion = async () => {
			setLoading(true);
			setError("");

			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch promotion");
				}

				const data = await res.json();
				setPromotion(data);
				setName(data.name || "");
				setDescription(data.description || "");
				setType(data.type || "");
				setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "");
				setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "");
				setMinSpending(data.minSpending?.toString() || "");
				setRate(data.rate?.toString() || "");
				setPoints(data.points?.toString() || "");
			} catch (err) {
				console.error("Failed to fetch promotion:", err);
				setError(err.message || "Failed to load promotion");
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchPromotion();
		}
	}, [id]);

	const handleSave = async () => {
		setSaving(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const updateData = {};
			if (name !== promotion.name) updateData.name = name;
			if (description !== promotion.description) updateData.description = description;
			if (type !== promotion.type) updateData.type = type;
			if (startTime) updateData.startTime = new Date(startTime).toISOString();
			if (endTime) updateData.endTime = new Date(endTime).toISOString();
			if (minSpending !== (promotion.minSpending?.toString() || "")) {
				updateData.minSpending = minSpending ? parseFloat(minSpending) : null;
			}
			if (rate !== (promotion.rate?.toString() || "")) {
				updateData.rate = rate ? parseFloat(rate) : null;
			}
			if (points !== (promotion.points?.toString() || "")) {
				updateData.points = points ? parseInt(points) : null;
			}

			if (Object.keys(updateData).length === 0) {
				setEditMode(false);
				setSaving(false);
				return;
			}

			const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(updateData)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update promotion");
			}

			const updated = await res.json();
			setPromotion({ ...promotion, ...updated });
			setEditMode(false);
		} catch (err) {
			console.error("Failed to update promotion:", err);
			setError(err.message || "Failed to update promotion");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to delete this promotion?")) {
			return;
		}

		setSaving(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to delete promotion");
			}

			navigate("/manager/promotions");
		} catch (err) {
			console.error("Failed to delete promotion:", err);
			setError(err.message || "Failed to delete promotion");
		} finally {
			setSaving(false);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Promotion Details</h1>
					</div>
					<div className="card">Loading...</div>
				</div>
			</div>
		);
	}

	if (error && !promotion) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Promotion Details</h1>
					</div>
					<div className="card" style={{ color: "red" }}>
						{error}
					</div>
					<div className="button-group">
						<button onClick={() => navigate("/manager/promotions")} className="button">
							Back to Promotions
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!promotion) {
		return null;
	}

	const canEdit = user && (user.role === "manager" || user.role === "superuser");

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">{promotion.name}</h1>
					{canEdit && !editMode && (
						<>
							<button
								className="button button-primary"
								onClick={() => setEditMode(true)}
								style={{ marginLeft: "1rem" }}
							>
								Edit
							</button>
							<button
								className="button"
								onClick={handleDelete}
								disabled={saving}
								style={{ marginLeft: "0.5rem", backgroundColor: "#dc3545", color: "white" }}
							>
								Delete
							</button>
						</>
					)}
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				<div className="card">
					<div className="label">Description</div>
					{editMode ? (
						<textarea
							className="input"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
						/>
					) : (
						<div className="value">{promotion.description}</div>
					)}
				</div>

				<div className="card">
					<div className="label">Type</div>
					{editMode ? (
						<select
							className="input"
							value={type}
							onChange={(e) => setType(e.target.value)}
						>
							<option value="automatic">Automatic</option>
							<option value="one-time">One-Time</option>
						</select>
					) : (
						<div className="value">{promotion.type}</div>
					)}
				</div>

				<div className="card">
					<div className="label">Start Time</div>
					{editMode ? (
						<input
							type="datetime-local"
							className="input"
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
						/>
					) : (
						<div className="value">{formatDate(promotion.startTime)}</div>
					)}
				</div>

				<div className="card">
					<div className="label">End Time</div>
					{editMode ? (
						<input
							type="datetime-local"
							className="input"
							value={endTime}
							onChange={(e) => setEndTime(e.target.value)}
						/>
					) : (
						<div className="value">{formatDate(promotion.endTime)}</div>
					)}
				</div>

				{promotion.minSpending !== null && (
					<div className="card">
						<div className="label">Min Spending</div>
						{editMode ? (
							<input
								type="number"
								step="0.01"
								className="input"
								value={minSpending}
								onChange={(e) => setMinSpending(e.target.value)}
							/>
						) : (
							<div className="value">${promotion.minSpending}</div>
						)}
					</div>
				)}

				{promotion.rate !== null && (
					<div className="card">
						<div className="label">Rate</div>
						{editMode ? (
							<input
								type="number"
								step="0.01"
								className="input"
								value={rate}
								onChange={(e) => setRate(e.target.value)}
							/>
						) : (
							<div className="value">{(promotion.rate * 100).toFixed(2)}%</div>
						)}
					</div>
				)}

				{promotion.points !== null && (
					<div className="card">
						<div className="label">Points</div>
						{editMode ? (
							<input
								type="number"
								className="input"
								value={points}
								onChange={(e) => setPoints(e.target.value)}
							/>
						) : (
							<div className="value">{promotion.points}</div>
						)}
					</div>
				)}

				{editMode && (
					<div className="button-group" style={{ marginTop: "1rem" }}>
						<button
							className="button button-primary"
							onClick={handleSave}
							disabled={saving}
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
						<button
							className="button"
							onClick={() => {
								setEditMode(false);
								setName(promotion.name || "");
								setDescription(promotion.description || "");
								setType(promotion.type || "");
								setStartTime(promotion.startTime ? new Date(promotion.startTime).toISOString().slice(0, 16) : "");
								setEndTime(promotion.endTime ? new Date(promotion.endTime).toISOString().slice(0, 16) : "");
								setMinSpending(promotion.minSpending?.toString() || "");
								setRate(promotion.rate?.toString() || "");
								setPoints(promotion.points?.toString() || "");
								setError("");
							}}
							disabled={saving}
						>
							Cancel
						</button>
					</div>
				)}

				<div className="button-group">
					<button onClick={() => navigate("/manager/promotions")} className="button">
						Back to Promotions
					</button>
				</div>
			</div>
		</div>
	);
};

export default PromotionDetail;
