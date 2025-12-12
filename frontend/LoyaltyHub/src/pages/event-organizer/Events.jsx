import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { formatDateTime } from "../../utils/formatDateTime";
import PaginationControls from "../../components/PaginationControls";
import "../../shared.css";
import "../user/Events.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const Events = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [events, setEvents] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchEvents = async () => {
			setLoading(true);
			setError("");

			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				// Fetch all events and filter by organizer on frontend
				// Or we could add a backend endpoint for this
				const params = new URLSearchParams();
				params.append("page", page.toString());
				params.append("limit", limit.toString());

				const res = await fetch(`${API_BASE_URL}/events?${params.toString()}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch events");
				}

				const data = await res.json();
				// Filter events where user is an organizer
				const myEvents = (data.results || []).filter(event => 
					event.organizers?.some(org => org.id === user.id)
				);
				
				setEvents(myEvents);
				// Note: count might not be accurate since we're filtering on frontend
				setTotalPages(Math.max(1, Math.ceil(myEvents.length / limit)));
			} catch (err) {
				console.error("Failed to fetch events:", err);
				setError(err.message || "Failed to load events");
			} finally {
				setLoading(false);
			}
		};

		if (user) {
			fetchEvents();
		}
	}, [page, limit, user]);

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">My Events</h1>
					</div>
					<div className="card">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">My Events</h1>
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				{events.length === 0 ? (
					<div className="card">No events found. You are not an organizer for any events.</div>
				) : (
					events.map((event) => (
						<div
							key={event.id}
							className="event-card"
							style={{ cursor: "pointer" }}
							onClick={() => navigate(`/event-organizer/events/${event.id}`)}
						>
							<div className="event-info">
								<div className="card-title">{event.name}</div>
								<div className="value location-label">Location: {event.location}</div>
								<div className="label">
									Start: {formatDateTime(event.startTime)}
								</div>
								<div className="label">End: {formatDateTime(event.endTime)}</div>
								{event.pointsRemain !== undefined && (
									<div className="label">Points Remaining: {event.pointsRemain}</div>
								)}
								<div className="label">Guests: {event.numGuests || event.guests?.length || 0}</div>
							</div>
							<button
								className="more-info-button button button-primary"
								onClick={(e) => {
									e.stopPropagation();
									navigate(`/event-organizer/events/${event.id}`);
								}}
							>
								Manage Event
							</button>
						</div>
					))
				)}

				{events.length > 0 && (
					<PaginationControls
						page={page}
						totalPages={totalPages}
						setPage={setPage}
						limit={limit}
						setLimit={setLimit}
					/>
				)}

				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						Back to Home
					</button>
				</div>
			</div>
		</div>
	);
};

export default Events;
