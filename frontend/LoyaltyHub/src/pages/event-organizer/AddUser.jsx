import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const AddUser = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user } = useAuth();

	const [utorId, setUtorId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

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
			const res = await fetch(`${API_BASE_URL}/events/${id}/guests`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ utorid: utorId })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to add guest");
			}

			const data = await res.json();
			setSuccess(`Successfully added ${data.guestAdded?.name || utorId} as a guest!`);
			setUtorId("");
		} catch (err) {
			console.error("Failed to add guest:", err);
			setError(err.message || "Failed to add guest");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Add Guest to Event</h1>
				</div>

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
							UtorId
						</div>
						<input
							type="text"
							className="input"
							value={utorId}
							onChange={(e) => setUtorId(e.target.value)}
							placeholder="Enter user's UtorId"
							required
						/>
					</div>

					<div className="button-group">
						<button
							type="submit"
							className="button button-primary"
							disabled={loading}
						>
							{loading ? "Adding..." : "Add Guest"}
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

export default AddUser;
