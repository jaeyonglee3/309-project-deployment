import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { QRCodeSVG } from "qrcode.react";
import "../../shared.css";
import "./QR.css";

const QR = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Prepare a payload with the user’s public information
	const payload = {
		utorid: user.utorid,
		email: user.email,
		name: user.name
	};

	// Convert the payload object to a JSON string and then encode it in base64
	// This makes it safe to include in a URL
	const encoded = btoa(JSON.stringify(payload));

	// Construct a public URL containing the encoded user data as a path parameter
	// This URL is publicly accessible by anyone who has it — no authentication required
	const publicUrl = `${window.location.origin}/public/profile/${encoded}`;

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Profile Details QR Code</h1>
				</div>

				<div className="button-group">
					<button onClick={() => navigate("/")} className="button">
						← Back to Home
					</button>
				</div>

				<div className="card">
					<div className="label">Instructions</div>
					<div className="value">
						Share this QR code with another LoyaltyHub user to share your
						profile information and enable them to initiate a transaction with
						you.
					</div>
				</div>

				<div className="card qr-card">
					<div className="qr-box">
						<QRCodeSVG value={publicUrl} size={180} />
					</div>

					<div className="value qr-code-value">
						Or, head to this{" "}
						<a href={publicUrl} target="_blank" rel="noopener noreferrer">
							{"link"}
						</a>{" "}
						instead
					</div>
				</div>
			</div>
		</div>
	);
};

export default QR;
