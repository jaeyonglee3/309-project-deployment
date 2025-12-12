import { useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/useAuth";
import "./MainPage.css";

const MainPage = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const handleViewProfile = () => {
		navigate("/profile");
	};

	const handleRedemptionRequest = () => {
		navigate("/user/redemption/request");
	};

	const roleRoutesMap = {
		regular: [
			{ label: "View Points", path: "/user/points" },
			{ label: "My QR Code", path: "/user/qr" },
			{ label: "Transfer Points", path: "/user/transfer" },
			{ label: "Promotions", path: "/user/promotions" },
			{ label: "Events", path: "/user/events" },
			{ label: "Transactions", path: "/user/transactions" }
		],
		cashier: [
			{
				label: "Create Purchase Transaction",
				path: "/cashier/transaction/create"
			},
			{
				label: "Process Redemption Request",
				path: "/cashier/redemption/process"
			}
		],
		manager: [
			{ label: "Users", path: "/manager/users" },
			{ label: "Transactions", path: "/manager/transactions" },
			{ label: "Promotions", path: "/manager/promotions" },
			{ label: "Events", path: "/manager/events" }
		],
		superuser: [{ label: "Promote User", path: "/superuser/promote" }]
	};

	const rolesOrder = ["regular", "cashier", "manager", "superuser"];

	const getRoleRoutes = (userRole) => {
		// Find the index of the current role in the hierarchy
		const roleIndex = rolesOrder.indexOf(userRole);
		if (roleIndex === -1) return [];

		// Collect routes from all roles up to the user's role
		const routes = [];
		for (let i = 0; i <= roleIndex; i++) {
			routes.push(...roleRoutesMap[rolesOrder[i]]);
		}

		return routes;
	};

	const getIcon = (label) => {
		const icons = {
			"View Profile": "👤",
			"Point Redemption Request": "🔁",
			"View Points": "⭐",
			"My QR Code": "📱",
			"Transfer Points": "💸",
			Promotions: "🎁",
			Events: "📅",
			Transactions: "📊",
			"Create Purchase Transaction": "➕",
			"Process Redemption Request": "✓",
			Users: "👥",
			"Promote User": "⬆️"
		};
		return icons[label] || "→";
	};

	return (
		<div className="main-page">
			<div className="main-page-container">
				{/* Page header with welcome message */}
				<div className="main-page-header">
					<h1 className="main-page-title">Welcome back, {user.name}</h1>
					<div className="main-page-subtitle">Manage your loyalty account</div>
				</div>

				{/* Points balance */}
				<div className="points-card">
					<div className="points-label">Your Points Balance</div>
					<div className="points-value">{user.points.toLocaleString()}</div>
				</div>

				{/* User info card */}
				<div className="user-info-card">
					<div className="user-info-header">
						<div className="user-info-name">{user.name}</div>
						<div className="user-info-role">{"Role: " + user.role}</div>
					</div>
					<div className="user-info-item">
						<div className="user-info-label">Member Since</div>
						<div className="user-info-value">
							{new Date(user.createdAt).toLocaleDateString(undefined, {
								year: "numeric",
								month: "long"
							})}
						</div>
					</div>
				</div>

				{/* Action menu */}
				<div className="quick-actions">
					<div className="quick-actions-title">Action menu</div>
					<div className="actions-container">
						<button onClick={handleViewProfile} className="action-button">
							<div className="action-button-icon">
								{getIcon("View Profile")}
							</div>
							<div className="action-button-text">Profile</div>
						</button>

						<button onClick={handleRedemptionRequest} className="action-button">
							<div className="action-button-icon">
								{getIcon("Point Redemption Request")}
							</div>
							<div className="action-button-text">Point Redemption Request</div>
						</button>

						{getRoleRoutes(user.role).map((route) => (
							<button
								key={route.path}
								onClick={() => navigate(route.path)}
								className="action-button"
							>
								<div className="action-button-icon">{getIcon(route.label)}</div>
								<div className="action-button-text">{route.label}</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MainPage;
