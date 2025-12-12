import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { formatDateTime } from "../../utils/formatDateTime";
import "../../shared.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const EventDetail = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user } = useAuth();

	const [event, setEvent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [editMode, setEditMode] = useState(false);
	const [saving, setSaving] = useState(false);
	const [publishing, setPublishing] = useState(false);

	// Edit form states
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [location, setLocation] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [capacity, setCapacity] = useState("");
	const [points, setPoints] = useState("");

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
				setName(data.name || "");
				setDescription(data.description || "");
				setLocation(data.location || "");
				setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "");
				setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "");
				setCapacity(data.capacity?.toString() || "");
				setPoints(data.pointsRemain ? (data.pointsRemain + (data.pointsAwarded || 0)).toString() : "");
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

	const handleSave = async () => {
		setSaving(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const updateData = {};
			if (name !== event.name) updateData.name = name;
			if (description !== event.description) updateData.description = description;
			if (location !== event.location) updateData.location = location;
			if (startTime) updateData.startTime = new Date(startTime).toISOString();
			if (endTime) updateData.endTime = new Date(endTime).toISOString();
			if (capacity !== (event.capacity?.toString() || "")) {
				updateData.capacity = capacity ? parseInt(capacity) : null;
			}
			if (points && (user?.role === "manager" || user?.role === "superuser")) {
				const totalPoints = parseInt(points);
				const currentAwarded = event.pointsAwarded || 0;
				if (totalPoints !== (event.pointsRemain + currentAwarded)) {
					updateData.points = totalPoints;
				}
			}

			if (Object.keys(updateData).length === 0) {
				setEditMode(false);
				setSaving(false);
				return;
			}

			const res = await fetch(`${API_BASE_URL}/events/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(updateData)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update event");
			}

			const updated = await res.json();
			setEvent({ ...event, ...updated });
			setEditMode(false);
		} catch (err) {
			console.error("Failed to update event:", err);
			setError(err.message || "Failed to update event");
		} finally {
			setSaving(false);
		}
	};

	const handlePublish = async () => {
		setPublishing(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/events/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ published: true })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to publish event");
			}

			const updated = await res.json();
			setEvent({ ...event, published: true });
		} catch (err) {
			console.error("Failed to publish event:", err);
			setError(err.message || "Failed to publish event");
		} finally {
			setPublishing(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) {
			return;
		}

		setSaving(true);
		setError("");

		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_BASE_URL}/events/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to delete event");
			}

			navigate("/manager/events");
		} catch (err) {
			console.error("Failed to delete event:", err);
			setError(err.message || "Failed to delete event");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Event Details</h1>
					</div>
					<div className="card">Loading...</div>
				</div>
			</div>
		);
	}

	if (error && !event) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Event Details</h1>
					</div>
					<div className="card" style={{ color: "red" }}>
						{error}
					</div>
					<div className="button-group">
						<button onClick={() => navigate("/manager/events")} className="button">
							Back to Events
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!event) {
		return null;
	}

	const canEdit = user && (user.role === "manager" || user.role === "superuser" || event.organizers?.some(org => org.id === user.id));
	const canDelete = user && (user.role === "manager" || user.role === "superuser");

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">{event.name}</h1>
					{canEdit && !editMode && (
						<button
							className="button button-primary"
							onClick={() => setEditMode(true)}
							style={{ marginLeft: "1rem" }}
						>
							Edit
						</button>
					)}
					{canDelete && !event.published && (
						<button
							className="button"
							onClick={handleDelete}
							disabled={saving}
							style={{ marginLeft: "0.5rem", backgroundColor: "#dc3545", color: "white" }}
						>
							Delete
						</button>
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
						<div className="value">{event.description}</div>
					)}
				</div>

				<div className="card">
					<div className="label">Location</div>
					{editMode ? (
						<input
							type="text"
							className="input"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
						/>
					) : (
						<div className="value">{event.location}</div>
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
						<div className="value">{formatDateTime(event.startTime)}</div>
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
						<div className="value">{formatDateTime(event.endTime)}</div>
					)}
				</div>

				<div className="card">
					<div className="label">Capacity</div>
					{editMode ? (
						<input
							type="number"
							className="input"
							value={capacity}
							onChange={(e) => setCapacity(e.target.value)}
							placeholder="Leave empty for unlimited"
						/>
					) : (
						<div className="value">{event.capacity || "Unlimited"}</div>
					)}
				</div>

				{(user?.role === "manager" || user?.role === "superuser" || event.organizers?.some(org => org.id === user.id)) && (
					<>
						{event.pointsRemain !== undefined && (
							<div className="card">
								<div className="label">Points Remaining</div>
								<div className="value">{event.pointsRemain}</div>
							</div>
						)}
						{event.pointsAwarded !== undefined && (
							<div className="card">
								<div className="label">Points Awarded</div>
								<div className="value">{event.pointsAwarded}</div>
							</div>
						)}
						{editMode && (user?.role === "manager" || user?.role === "superuser") && (
							<div className="card">
								<div className="label">Total Points</div>
								<input
									type="number"
									className="input"
									value={points}
									onChange={(e) => setPoints(e.target.value)}
									placeholder="Total points to allocate"
								/>
							</div>
						)}
					</>
				)}

				{event.published !== undefined && (
					<div className="card">
						<div className="label">Published</div>
						<div className="value">{event.published ? "Yes" : "No"}</div>
					</div>
				)}

				{event.organizers && event.organizers.length > 0 && (
					<div className="card">
						<div className="label">Organizers</div>
						{event.organizers.map((org) => (
							<div key={org.id} className="value" style={{ marginBottom: "0.5rem" }}>
								{org.name} ({org.utorid})
							</div>
						))}
					</div>
				)}

				{event.guests && event.guests.length > 0 && (
					<div className="card">
						<div className="label">Guests ({event.guests.length})</div>
						{event.guests.slice(0, 5).map((guest) => (
							<div key={guest.id} className="value" style={{ marginBottom: "0.5rem" }}>
								{guest.name} ({guest.utorid})
							</div>
						))}
						{event.guests.length > 5 && (
							<div className="label">... and {event.guests.length - 5} more</div>
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
								setName(event.name || "");
								setDescription(event.description || "");
								setLocation(event.location || "");
								setStartTime(event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : "");
								setEndTime(event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "");
								setCapacity(event.capacity?.toString() || "");
								setPoints(event.pointsRemain ? (event.pointsRemain + (event.pointsAwarded || 0)).toString() : "");
								setError("");
							}}
							disabled={saving}
						>
							Cancel
						</button>
					</div>
				)}

				{!editMode && (user?.role === "manager" || user?.role === "superuser") && !event.published && (
					<div className="button-group" style={{ marginTop: "1rem" }}>
						<button
							className="button button-primary"
							onClick={handlePublish}
							disabled={publishing}
						>
							{publishing ? "Publishing..." : "Publish Event"}
						</button>
					</div>
				)}

				<div className="button-group">
					{(user?.role === "manager" || user?.role === "superuser") && (
						<button
							onClick={() => navigate(`/manager/events/${id}/members`)}
							className="button"
						>
							Manage Members
						</button>
					)}
					<button onClick={() => navigate("/manager/events")} className="button">
						Back to Events
					</button>
				</div>
			</div>
		</div>
	);
};

export default EventDetail;
