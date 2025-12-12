import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { formatDateTime } from "../utils/formatDateTime";
import "../shared.css";

const Profile = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	console.log(user);

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Profile</h1>
				</div>

				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						← Back to Home
					</button>
				</div>

				<div className="card">
					<div className="label">Name</div>
					<div className="value">{user.name}</div>
				</div>

				<div className="card">
					<div className="label">Email</div>
					<div className="value">{user.email}</div>
				</div>

				<div className="card">
					<div className="label">Role</div>
					<div className="value">{user.role}</div>
				</div>

				<div className="card">
					<div className="label">Points</div>
					<div className="value">{user.points.toLocaleString()}</div>
				</div>

				<div className="card">
					<div className="label">Member Since</div>
					<div className="value">{formatDateTime(user.createdAt)}</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
