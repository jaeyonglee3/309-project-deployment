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

	// Filter states
	const [showFilters, setShowFilters] = useState(false);
	const [name, setName] = useState("");
	const [location, setLocation] = useState("");
	const [started, setStarted] = useState("");
	const [ended, setEnded] = useState("");
	const [published, setPublished] = useState("");
	const [showFull, setShowFull] = useState(false);

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
				const params = new URLSearchParams();
				if (name) params.append("name", name);
				if (location) params.append("location", location);
				if (started !== "") params.append("started", started);
				if (ended !== "") params.append("ended", ended);
				if (published !== "") params.append("published", published);
				if (showFull) params.append("showFull", "true");
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
				setEvents(data.results || []);
				const totalCount = data.count || 0;
				setTotalPages(Math.max(1, Math.ceil(totalCount / limit)));
			} catch (err) {
				console.error("Failed to fetch events:", err);
				setError(err.message || "Failed to load events");
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, [page, limit, name, location, started, ended, published, showFull]);

	if (loading) {
		return (
			<div className="page-container">
				<div className="page-content">
					<div className="page-header">
						<h1 className="page-title">Events</h1>
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
					<h1 className="page-title">Events</h1>
					{(user?.role === "manager" || user?.role === "superuser") && (
						<button
							onClick={() => navigate("/manager/events/create")}
							className="button button-primary"
							style={{ marginLeft: "1rem" }}
						>
							Create Event
						</button>
					)}
				</div>

				{error && (
					<div className="card" style={{ color: "red", marginBottom: "1rem" }}>
						{error}
					</div>
				)}

				{/* Filters */}
				<div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "0.5rem"
						}}
					>
						<button
							className="button"
							onClick={() => setShowFilters(!showFilters)}
						>
							{showFilters ? "Hide Filters" : "Show Filters"}
						</button>
					</div>

					{showFilters && (
						<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
							<input
								type="text"
								placeholder="Search by name"
								className="input"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setPage(1);
								}}
							/>
							<input
								type="text"
								placeholder="Search by location"
								className="input"
								value={location}
								onChange={(e) => {
									setLocation(e.target.value);
									setPage(1);
								}}
							/>
							<select
								className="input"
								value={started}
								onChange={(e) => {
									setStarted(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All Start Status</option>
								<option value="true">Started</option>
								<option value="false">Not Started</option>
							</select>
							<select
								className="input"
								value={ended}
								onChange={(e) => {
									setEnded(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All End Status</option>
								<option value="true">Ended</option>
								<option value="false">Not Ended</option>
							</select>
							<select
								className="input"
								value={published}
								onChange={(e) => {
									setPublished(e.target.value);
									setPage(1);
								}}
							>
								<option value="">All Publication Status</option>
								<option value="true">Published</option>
								<option value="false">Not Published</option>
							</select>
							<label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
								<input
									type="checkbox"
									checked={showFull}
									onChange={(e) => {
										setShowFull(e.target.checked);
										setPage(1);
									}}
								/>
								<span>Show Full Events</span>
							</label>
						</div>
					)}
				</div>

				{/* Events List */}
				{events.length === 0 ? (
					<div className="card">No events found.</div>
				) : (
					events.map((event) => (
						<div
							key={event.id}
							className="event-card"
							style={{ cursor: "pointer" }}
							onClick={() => navigate(`/manager/events/${event.id}`)}
						>
							<div className="event-info">
								<div className="card-title">{event.name}</div>
								<div className="value location-label">Location: {event.location}</div>
								<div className="label">
									Start: {formatDateTime(event.startTime)}
								</div>
								<div className="label">End: {formatDateTime(event.endTime)}</div>
								{event.capacity && (
									<div className="label">Capacity: {event.capacity}</div>
								)}
								<div className="label">Guests: {event.numGuests || 0}</div>
								{(user?.role === "manager" || user?.role === "superuser") && (
									<>
										{event.pointsRemain !== undefined && (
											<div className="label">Points Remaining: {event.pointsRemain}</div>
										)}
										<div className="label">
											Published: {event.published ? "Yes" : "No"}
										</div>
									</>
								)}
							</div>
							<button
								className="more-info-button button button-primary"
								onClick={(e) => {
									e.stopPropagation();
									navigate(`/manager/events/${event.id}`);
								}}
							>
								View Details
							</button>
						</div>
					))
				)}

				{/* Pagination */}
				<PaginationControls
					page={page}
					totalPages={totalPages}
					setPage={setPage}
					limit={limit}
					setLimit={setLimit}
				/>

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
