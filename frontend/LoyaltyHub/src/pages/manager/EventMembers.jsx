import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const EventMembers = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user } = useAuth();

	const [event, setEvent] = useState(null);
	const [organizers, setOrganizers] = useState([]);
	const [guests, setGuests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [addingOrganizer, setAddingOrganizer] = useState(false);
	const [addingGuest, setAddingGuest] = useState(false);
	const [organizerUtorId, setOrganizerUtorId] = useState("");
	const [guestUtorId, setGuestUtorId] = useState("");

	useEffect(() => {
		const fetchEvent = async () => {
			setLoading(true);
			setError("");

			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`${API_BASE_URL}/events/${id}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch event");
				}

				const data = await res.json();
				setEvent(data);
				setOrganizers(data.organizers || []);
				setGuests(data.guests || []);
			} catch (err) {
				console.error("Failed to fetch event:", err);
				setError(err.message || "Failed to load event");
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchEvent();
		}
	}, [id]);

	const handleAddOrganizer = async (e) => {
		e.preventDefault();
		setAddingOrganizer(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/events/${id}/organizers`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ utorid: organizerUtorId })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to add organizer");
			}

			const updated = await res.json();
			setOrganizers(updated.organizers || []);
			setOrganizerUtorId("");
		} catch (err) {
			console.error("Failed to add organizer:", err);
			setError(err.message || "Failed to add organizer");
		} finally {
			setAddingOrganizer(false);
		}
	};

	const handleRemoveOrganizer = async (userId) => {
		if (!window.confirm("Are you sure you want to remove this organizer?")) {
			return;
		}

		setError("");
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/events/${id}/organizers/${userId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to remove organizer");
			}

			setOrganizers(organizers.filter(org => org.id !== userId));
		} catch (err) {
			console.error("Failed to remove organizer:", err);
			setError(err.message || "Failed to remove organizer");
		}
	};

	const handleAddGuest = async (e) => {
		e.preventDefault();
		setAddingGuest(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/events/${id}/guests`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ utorid: guestUtorId })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to add guest");
			}

			const updated = await res.json();
			setGuests([...guests, updated.guestAdded]);
			setGuestUtorId("");
		} catch (err) {
			console.error("Failed to add guest:", err);
			setError(err.message || "Failed to add guest");
		} finally {
			setAddingGuest(false);
		}
	};

	const handleRemoveGuest = async (userId) => {
		if (!window.confirm("Are you sure you want to remove this guest?")) {
			return;
		}

		setError("");
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/events/${id}/guests/${userId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to remove guest");
			}

			setGuests(guests.filter(guest => guest.id !== userId));
		} catch (err) {
			console.error("Failed to remove guest:", err);
			setError(err.message || "Failed to remove guest");
		}
	};

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Event Members</h1>
					</div>
					<div className="card">Loading...</div>
				</div>
			</div>
		);
	}

	if (!user || (user.role !== "manager" && user.role !== "superuser")) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Event Members</h1>
					</div>
					<div className="card" style={{ color: "red" }}>
						Access denied. Manager or Superuser role required.
					</div>
					<div className="button-group">
						<button onClick={() => navigate(`/manager/events/${id}`)} className="button">
							Back to Event
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
					<h1 className="page-title">Event Members</h1>
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				{/* Add Organizer */}
				<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
					<div className="label" style={{ marginBottom: "0.5rem" }}>Add Organizer</div>
					<form onSubmit={handleAddOrganizer}>
						<input
							type="text"
							className="input"
							placeholder="Enter UtorId"
							value={organizerUtorId}
							onChange={(e) => setOrganizerUtorId(e.target.value)}
							required
							style={{ marginBottom: "0.5rem" }}
						/>
						<button
							type="submit"
							className="button button-primary"
							disabled={addingOrganizer}
						>
							{addingOrganizer ? "Adding..." : "Add Organizer"}
						</button>
					</form>
				</div>

				{/* Organizers List */}
				<div className="card" style={{ marginBottom: "1rem" }}>
					<div className="label" style={{ marginBottom: "0.5rem" }}>Organizers ({organizers.length})</div>
					{organizers.length === 0 ? (
						<div className="label">No organizers</div>
					) : (
						organizers.map((org) => (
							<div key={org.id} className="card" style={{ marginBottom: "0.5rem", padding: "0.5rem" }}>
								<div className="value">{org.name}</div>
								<div className="label">UtorId: {org.utorid}</div>
								<button
									className="button"
									onClick={() => handleRemoveOrganizer(org.id)}
									style={{ marginTop: "0.5rem", backgroundColor: "#dc3545", color: "white" }}
								>
									Remove
								</button>
							</div>
						))
					)}
				</div>

				{/* Add Guest */}
				<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
					<div className="label" style={{ marginBottom: "0.5rem" }}>Add Guest</div>
					<form onSubmit={handleAddGuest}>
						<input
							type="text"
							className="input"
							placeholder="Enter UtorId"
							value={guestUtorId}
							onChange={(e) => setGuestUtorId(e.target.value)}
							required
							style={{ marginBottom: "0.5rem" }}
						/>
						<button
							type="submit"
							className="button button-primary"
							disabled={addingGuest}
						>
							{addingGuest ? "Adding..." : "Add Guest"}
						</button>
					</form>
				</div>

				{/* Guests List */}
				<div className="card">
					<div className="label" style={{ marginBottom: "0.5rem" }}>Guests ({guests.length})</div>
					{guests.length === 0 ? (
						<div className="label">No guests</div>
					) : (
						guests.map((guest) => (
							<div key={guest.id} className="card" style={{ marginBottom: "0.5rem", padding: "0.5rem" }}>
								<div className="value">{guest.name}</div>
								<div className="label">UtorId: {guest.utorid}</div>
								<button
									className="button"
									onClick={() => handleRemoveGuest(guest.id)}
									style={{ marginTop: "0.5rem", backgroundColor: "#dc3545", color: "white" }}
								>
									Remove
								</button>
							</div>
						))
					)}
				</div>

				<div className="button-group">
					<button onClick={() => navigate(`/manager/events/${id}`)} className="button">
						Back to Event
					</button>
				</div>
			</div>
		</div>
	);
};

export default EventMembers;
