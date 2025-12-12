import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const AwardPoints = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user } = useAuth();

	const [event, setEvent] = useState(null);
	const [awardType, setAwardType] = useState("single");
	const [utorId, setUtorId] = useState("");
	const [amount, setAmount] = useState("");
	const [remark, setRemark] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		const fetchEvent = async () => {
			const token = localStorage.getItem("token");
			try {
				const res = await fetch(`${API_BASE_URL}/events/${id}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (res.ok) {
					const data = await res.json();
					setEvent(data);
				}
			} catch (err) {
				console.error("Failed to fetch event:", err);
			}
		};

		if (id) {
			fetchEvent();
		}
	}, [id]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		const token = localStorage.getItem("token");
		if (!token) {
			setError("Not authenticated");
			setLoading(false);
			return;
		}

		try {
			const payload = {
				type: "event",
				amount: parseInt(amount)
			};

			if (awardType === "single") {
				if (!utorId) {
					throw new Error("UtorId is required for single guest award");
				}
				payload.utorid = utorId;
			}

			if (remark) {
				payload.remark = remark;
			}

			const res = await fetch(`${API_BASE_URL}/events/${id}/transactions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to award points");
			}

			const data = await res.json();
			if (Array.isArray(data)) {
				setSuccess(`Successfully awarded ${amount} points to ${data.length} guests!`);
			} else {
				setSuccess(`Successfully awarded ${data.awarded || amount} points to ${data.recipient || utorId}!`);
			}

			// Refresh event data
			const eventRes = await fetch(`${API_BASE_URL}/events/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if (eventRes.ok) {
				const eventData = await eventRes.json();
				setEvent(eventData);
			}

			setUtorId("");
			setAmount("");
			setRemark("");
		} catch (err) {
			console.error("Failed to award points:", err);
			setError(err.message || "Failed to award points");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Award Points</h1>
				</div>

				{event && (
					<div className="card" style={{ marginBottom: "1rem" }}>
						<div className="label">Event: {event.name}</div>
						<div className="label">Points Remaining: {event.pointsRemain || 0}</div>
						<div className="label">Guests: {event.guests?.length || event.numGuests || 0}</div>
					</div>
				)}

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				{success && (
					<div className="card" style={{ color: "green", marginBottom: "1rem" }}>
						{success}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>
							Award Type
						</div>
						<select
							className="input"
							value={awardType}
							onChange={(e) => {
								setAwardType(e.target.value);
								setUtorId("");
							}}
						>
							<option value="single">Single Guest</option>
							<option value="all">All Guests</option>
						</select>
					</div>

					{awardType === "single" && (
						<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
							<div className="label" style={{ marginBottom: "0.5rem" }}>
								UtorId *
							</div>
							<input
								type="text"
								className="input"
								value={utorId}
								onChange={(e) => setUtorId(e.target.value)}
								placeholder="Enter guest's UtorId"
								required
							/>
						</div>
					)}

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>
							Points Amount *
						</div>
						<input
							type="number"
							className="input"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="Enter points to award"
							required
							min="1"
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>
							Remark (Optional)
						</div>
						<input
							type="text"
							className="input"
							value={remark}
							onChange={(e) => setRemark(e.target.value)}
							placeholder="Optional remark"
						/>
					</div>

					<div className="button-group">
						<button
							type="submit"
							className="button button-primary"
							disabled={loading}
						>
							{loading ? "Awarding..." : "Award Points"}
						</button>
						<button
							type="button"
							onClick={() => navigate(`/event-organizer/events/${id}`)}
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

export default AwardPoints;
