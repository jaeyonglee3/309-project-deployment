import { useParams } from "react-router-dom";

export default function PublicUser() {
	const { data } = useParams();

	let userInfo = null;

	try {
		const json = atob(data);
		userInfo = JSON.parse(json);
	} catch {
		return <div>Invalid or corrupted QR link.</div>;
	}

	return (
		<div className="page-container">
			<div className="page-content">
				<div className="page-header">
					<h1 className="page-title">User Information</h1>
				</div>

				<div className="card">
					<div className="label">
						This is LoyaltyHub user information accessed via QR code or a shared
						link.
					</div>
					<div className="label">
						Please close this tab once you are finished.
					</div>
				</div>

				<div className="card">
					<div className="label">Name</div>
					<div className="value">{userInfo.name}</div>
				</div>

				<div className="card">
					<div className="label">UtorId</div>
					<div className="value">{userInfo.utorid}</div>
				</div>

				<div className="card">
					<div className="label">Email</div>
					<div className="value">{userInfo.email}</div>
				</div>
			</div>
		</div>
	);
}
