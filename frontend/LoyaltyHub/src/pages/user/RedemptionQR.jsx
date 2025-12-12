import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import "../../shared.css";
import "./QR.css";

const RedemptionQR = () => {
	const { transactionId } = useParams();
	const navigate = useNavigate();

	// Construct a public URL containing the transaction id
	// This URL is publicly accessible by anyone who has it — no authentication required
	const publicUrl = `${window.location.origin}/public/redemption/${transactionId}`;

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Points Redemption Request QR Code</h1>
				</div>

				<div className="button-group">
					<button
						onClick={() => navigate("/user/transactions")}
						className="button"
					>
						← Back to Transaction
					</button>
				</div>

				<div className="card">
					<div className="label">Instructions</div>
					<div className="value">
						Share this QR code with a cashier and they will complete your point
						redemption request.
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

export default RedemptionQR;
