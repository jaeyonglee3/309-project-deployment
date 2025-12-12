import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const saved = localStorage.getItem("token");
		if (!saved) {
			setLoading(false);
			return;
		}

		const fetchUser = async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/users/me`, {
					headers: {
						Authorization: `Bearer ${saved}`
					}
				});

				if (!res.ok) {
					localStorage.removeItem("token");
					setUser(null);
					navigate("/login");
					return;
				}
				const userData = await res.json();
				setUser(userData);
			} catch (err) {
				console.error("Failed to fetch user:", err);
				localStorage.removeItem("token");
				setUser(null);
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, [navigate]);

	/*
	 * Login the user with the given utorid
	 */
	const login = async (utorid, password) => {
		try {
			const res = await fetch(`${API_BASE_URL}/auth/tokens`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ utorid, password })
			});

			const data = await res.json();

			if (!res.ok) {
				return { status: res.status, message: data.message || "Login failed" };
			}

			// Save token
			localStorage.setItem("token", data.token);

			// Fetch user data
			const userRes = await fetch(`${API_BASE_URL}/users/me`, {
				headers: {
					Authorization: `Bearer ${data.token}`
				}
			});

			if (!userRes.ok) {
				console.error("Failed to fetch user after login");
				return {
					status: userRes.status,
					message: "Unable to load user profile."
				};
			}

			const userData = await userRes.json();
			setUser(userData);

			navigate("/");
			return { status: 200, user: userData }; // success
		} catch (err) {
			console.error("login attempt failed", err);
			return { status: 500, message: "Login failed due to server error." };
		}
	};

	/*
	 * Logout the currently authenticated user.
	 */
	const logout = () => {
		// Remove token from storage
		localStorage.removeItem("token");

		// Clear user state
		setUser(null);

		// Navigate away
		navigate("/login");
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};
