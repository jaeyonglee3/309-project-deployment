import "./Navbar.css";
import { useAuth } from "../contexts/useAuth";
import { useLocation } from "react-router-dom";

export default function Navbar() {
	const { logout } = useAuth();
	const location = useLocation();

	// Paths where logout should be hidden
	const hideLogoutPaths = ["/login", "/register"];

	const showLogout = !hideLogoutPaths.includes(location.pathname);

	return (
		<div className="navbar">
			<h2>LoyaltyHub</h2>
			{showLogout && (
				<button className="logout-button" onClick={() => logout()}>
					← Log out
				</button>
			)}
		</div>
	);
}
