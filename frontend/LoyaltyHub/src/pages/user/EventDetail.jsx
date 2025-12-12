import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatDateTime } from "../../utils/formatDateTime";
import "../../shared.css";

const EventDetail = () => {
	const navigate = useNavigate();
	const params = useParams();
	const [error, setError] = useState("");
	const [rsvpMessage, setRsvpMessage] = useState("");
	const [rsvpErrorMessage, setRsvpErrorMessage] = useState("");
	const [event, setEvent] = useState(null);
	const eventId = params.id;
	const API_BASE_URL =
		import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

	const onRsvpClick = async () => {
		const token = localStorage.getItem("token");

		try {
			const res = await fetch(`${API_BASE_URL}/events/${eventId}/guests/me`, {
				method: "POST",
				headers: {
					Authorization: token ? `Bearer ${token}` : ""
				}
			});

			// 201 Created — RSVP successful
			if (res.status === 201) {
				setError("");
				setRsvpMessage(`RSVP successful! You're added as a guest.`);
				return;
			}

			// 400 — user already RSVP'd
			if (res.status === 400) {
				setRsvpMessage("");
				setRsvpErrorMessage("You have already RSVP'd to this event!");
				return;
			}

			// 410 — event full or ended
			if (res.status === 410) {
				setRsvpMessage("");
				setRsvpErrorMessage("This event is full or no longer accepting RSVPs!");
				return;
			}

			// Unexpected response
			setRsvpMessage("");
			setRsvpErrorMessage("This event is full or no longer accepting RSVPs!");
		} catch (error) {
			setRsvpMessage("");
			setRsvpErrorMessage("This event is full or no longer accepting RSVPs!");
			console.error(error);
		}
	};

	useEffect(() => {
		const fetchEvent = async () => {
			const token = localStorage.getItem("token");

			try {
				const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
					headers: {
						Authorization: token ? `Bearer ${token}` : ""
					}
				});

				if (!res.ok) {
					setError(
						`Failed to fetch event with id ${eventId}: ${res.status} ${res.statusText}`
					);
					setEvent(null);
					return;
				}

				const data = await res.json();
				setEvent(data);
				setError("");
			} catch (error) {
				setError("Error fetching events: " + error.message);
				setEvent(null);
			}
		};
		fetchEvent();
	}, [API_BASE_URL, eventId]);

	if (!event) return <div>Loading event details...</div>;

	return (
		<div className="page-container">
			<div className="page-content">
				{error && <div className="error-message">{error}</div>}

				<div className="page-header">
					<h1 className="page-title">{event.name}</h1>
				</div>

				<div className="button-group">
					<button onClick={() => navigate("/user/events")} className="button">
						← Back to Events
					</button>
				</div>

				<div className="card">
					<div className="label">Start</div>
					<div className="value">{formatDateTime(event.startTime)}</div>
				</div>

				<div className="card">
					<div className="label">End</div>
					<div className="value">{formatDateTime(event.endTime)}</div>
				</div>

				<div className="card">
					<div className="label">Location</div>
					<div className="value">{event.location}</div>
				</div>

				<div className="card">
					<div className="label">Description</div>
					<div className="value">{event.description}</div>
				</div>

				<div className="card">
					<div className="label">Event Capacity</div>
					<div className="value">
						{event.capacity ? event.capacity : "Not found"}
					</div>
				</div>

				<div className="card">
					<div className="label">RSVP</div>
					<button className="button" onClick={() => onRsvpClick()}>
						RSVP Now →
					</button>
					{rsvpErrorMessage && (
						<div className="error-message">{rsvpErrorMessage}</div>
					)}
					{rsvpMessage && <div className="green-message">{rsvpMessage}</div>}
				</div>
			</div>
		</div>
	);
};

export default EventDetail;
