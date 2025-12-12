import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const EventCreate = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [location, setLocation] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [capacity, setCapacity] = useState("");
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
				location,
				startTime: new Date(startTime).toISOString(),
				endTime: new Date(endTime).toISOString(),
				points: parseInt(points)
			};

			if (capacity) payload.capacity = parseInt(capacity);

			const res = await fetch(`${API_BASE_URL}/events`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to create event");
			}

			navigate("/manager/events");
		} catch (err) {
			console.error("Failed to create event:", err);
			setError(err.message || "Failed to create event");
		} finally {
			setLoading(false);
		}
	};

	if (!user || (user.role !== "manager" && user.role !== "superuser")) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Create Event</h1>
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
					<h1 className="page-title">Create Event</h1>
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
						<div className="label" style={{ marginBottom: "0.5rem" }}>Location *</div>
						<input
							type="text"
							className="input"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							required
						/>
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
						<div className="label" style={{ marginBottom: "0.5rem" }}>Capacity (Optional)</div>
						<input
							type="number"
							className="input"
							value={capacity}
							onChange={(e) => setCapacity(e.target.value)}
							placeholder="Leave empty for unlimited"
						/>
					</div>

					<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
						<div className="label" style={{ marginBottom: "0.5rem" }}>Points *</div>
						<input
							type="number"
							className="input"
							value={points}
							onChange={(e) => setPoints(e.target.value)}
							required
							placeholder="Points to allocate for this event"
						/>
					</div>

					<div className="button-group">
						<button
							type="submit"
							className="button button-primary"
							disabled={loading}
						>
							{loading ? "Creating..." : "Create Event"}
						</button>
						<button
							type="button"
							onClick={() => navigate("/manager/events")}
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

export default EventCreate;
