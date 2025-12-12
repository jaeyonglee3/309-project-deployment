import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/formatDateTime";
import PaginationControls from "../../components/PaginationControls";
import "../../shared.css";
import "./Events.css";

const Events = () => {
	const API_BASE_URL =
		import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
	const navigate = useNavigate();

	// Data and pagination states
	const [events, setEvents] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(3);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState([]);

	useEffect(() => {
		const fetchEvents = async () => {
			const token = localStorage.getItem("token");

			const buildQueryString = () => {
				const params = new URLSearchParams();
				params.append("page", page);
				params.append("limit", limit);
				return params.toString();
			};

			try {
				const qs = buildQueryString();
				const res = await fetch(`${API_BASE_URL}/events?${qs}`, {
					headers: {
						Authorization: token ? `Bearer ${token}` : ""
					}
				});

				if (!res.ok) {
					setError(`Failed to fetch events: ${res.status} ${res.statusText}`);
					setEvents([]);
					return;
				}

				const data = await res.json();
				setEvents(data.results);
				setTotalPages(Math.ceil(data.count / limit) || 1);
				setError("");
			} catch (error) {
				setError("Error fetching events: " + error.message);
				setEvents([]);
			}
		};

		fetchEvents();
	}, [API_BASE_URL, limit, page]);

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Events</h1>
				</div>

				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						← Back to Home
					</button>
				</div>

				{error && <div className="error-message">Error fetching events</div>}

				{events.map((event) => (
					<div key={event.id} className="event-card">
						<div className="event-info">
							<div className="card-title">{event.name}</div>
							<div className="value location-label">
								Location: {event.location}
							</div>
							<div className="label">
								Start: {formatDateTime(event.startTime)}
							</div>
							<div className="label">End: {formatDateTime(event.endTime)}</div>
						</div>

						<button
							className="more-info-button button button-primary"
							onClick={() => navigate(`/user/events/${event.id}`)}
						>
							More Info & RSVP
						</button>
					</div>
				))}

				{events?.length !== 0 && (
					<PaginationControls
						page={page}
						totalPages={totalPages}
						setPage={setPage}
						limit={limit}
						setLimit={setLimit}
					/>
				)}
			</div>
		</div>
	);
};

export default Events;
