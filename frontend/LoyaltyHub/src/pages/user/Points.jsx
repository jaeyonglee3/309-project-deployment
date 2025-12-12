import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "../../shared.css";

const Points = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Points</h1>
				</div>

				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						← Back to Home
					</button>
				</div>

				<div className="points-card">
					<div className="points-label">Current Balance</div>
					<div className="points-value">{user.points.toLocaleString()}</div>
					<div
						style={{
							fontSize: "0.875rem",
							color: "rgba(255, 255, 255, 0.8)",
							marginTop: "0.5rem"
						}}
					>
						points
					</div>
				</div>
				<button
					onClick={() => navigate("/user/transactions")}
					className="button"
				>
					View Transactions 📊
				</button>
			</div>
		</div>
	);
};

export default Points;
