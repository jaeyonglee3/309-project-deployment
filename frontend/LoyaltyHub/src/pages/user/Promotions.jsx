import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatDateTime } from "../../utils/formatDateTime";
import { formatPercentage } from "../../utils/formatPercentage";
import PaginationControls from "../../components/PaginationControls";
import "../../shared.css";
import "./Promotions.css";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const Promotions = () => {
	const navigate = useNavigate();

	// Data and pagination states
	const [promotions, setPromotions] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(3);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState([]);

	useEffect(() => {
		const fetchPromotions = async () => {
			const token = localStorage.getItem("token");

			const buildQueryString = () => {
				const params = new URLSearchParams();
				params.append("page", page);
				params.append("limit", limit);
				return params.toString();
			};

			try {
				const qs = buildQueryString();
				const res = await fetch(`${API_BASE_URL}/promotions?${qs}`, {
					headers: {
						Authorization: token ? `Bearer ${token}` : ""
					}
				});

				if (!res.ok) {
					setError(`Failed to fetch promotions (${res.status})`);
					return;
				}

				const data = await res.json();
				setError("");

				let results = data.results || [];

				setPromotions(results);
				setTotalPages(Math.ceil(data.count / limit) || 1);
			} catch (err) {
				console.error(err);
				setError("Network error fetching promotions.");
			}
		};
		fetchPromotions();
	}, [limit, page]);

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Promotions</h1>
				</div>

				{/* Back home button */}
				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						← Back to Home
					</button>
				</div>

				{/* Error message */}
				{error && <div className="error-message">{error}</div>}

				{/* List of promotions */}
				{promotions.map((promo) => (
					<div key={promo.id} className="card">
						<div className="promo-card-top">
							<div className="card-title">{promo.name}</div>
							<div className="promo-badge">
								{"Promo Rate: " + formatPercentage(promo.rate)}
							</div>
						</div>

						<div className="promo-row">
							<div className="label">Promo ID:</div>
							<div className="promo-value-strong">{promo.id}</div>
						</div>

						<div className="promo-row">
							<div className="label">Type:</div>
							<div className="promo-value-strong">{promo.type}</div>
						</div>

						<div className="promo-row">
							<div className="label">Promotional Points:</div>
							<div className="promo-value-strong">{promo.points}</div>
						</div>

						<div className="promo-row">
							<div className="label">Minimum Spend:</div>
							<div className="promo-value-strong">
								{"$" + promo.minSpending}
							</div>
						</div>

						<div className="promo-row">
							<div className="label">End Time:</div>
							<div className="promo-value-strong">
								{formatDateTime(promo.endTime)}
							</div>
						</div>
					</div>
				))}

				{promotions?.length !== 0 && (
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

export default Promotions;
