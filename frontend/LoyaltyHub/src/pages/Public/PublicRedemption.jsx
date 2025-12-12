import { useParams } from "react-router-dom";

export default function PublicRedemption() {
	const { transactionId } = useParams();

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">Redemption Transaction Information</h1>
				</div>

				<div className="card">
					<div className="label">
						This is LoyaltyHub transaction information accessed via QR code or a
						shared link.
					</div>
					<div className="label">
						Please close this tab once you are finished.
					</div>
				</div>

				<div className="card">
					<div className="label">Redemption Request Transaction ID</div>
					<div className="value">{transactionId}</div>
				</div>
			</div>
		</div>
	);
}
