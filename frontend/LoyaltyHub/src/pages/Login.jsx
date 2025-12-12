import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import "../shared.css";
import "./Login.css";

const Login = () => {
	const [utorid, setUtorid] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loginError, setLoginError] = useState(null);
	const { user, loading, login } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && user) {
			navigate("/");
		}
	}, [user, loading, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		const { status, message } = await login(utorid, password);

		if (status === 401) {
			setLoginError("Incorrect username or password.");
		} else if (status !== 200) {
			setLoginError(message || "An error occurred. Please try again.");
		} else {
			setLoginError(null);
		}
	};

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Login</h1>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<input
						placeholder="UtorId"
						className="input"
						value={utorid}
						onChange={(e) => setUtorid(e.target.value)}
						required
					/>
					<div className="password-input-container">
						<input
							type={showPassword ? "text" : "password"}
							placeholder="Password"
							className="input"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<button
							type="button"
							className="password-toggle-button"
							onClick={() => setShowPassword(!showPassword)}
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? "Hide" : "Show"}
						</button>
					</div>
					<button type="submit" className="button button-primary">
						Login
					</button>
				</form>
				{loginError && <p className="error-message">{loginError}</p>}
			</div>
		</div>
	);
};

export default Login;
