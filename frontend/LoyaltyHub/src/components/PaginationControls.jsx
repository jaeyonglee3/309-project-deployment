// src/components/PaginationControls.jsx

const PaginationControls = ({ page, totalPages, setPage, limit, setLimit }) => {
	return (
		<div className="pagination-container">
			{/* Pagination */}
			<div className="pagination-bar">
				<button
					className="pagination-btn"
					disabled={page <= 1}
					onClick={() => setPage((p) => Math.max(1, p - 1))}
				>
					← Prev Page
				</button>

				<div className="pagination-page">
					Page {page} of {totalPages}
				</div>

				<button
					className="pagination-btn"
					disabled={page >= totalPages}
					onClick={() => setPage((p) => p + 1)}
				>
					Next Page →
				</button>
			</div>

			{/* Results per page */}
			<div className="results-per-page">
				<label className="label">Results per page:</label>
				<select
					className="input"
					value={limit}
					onChange={(e) => {
						setLimit(Number(e.target.value));
						setPage(1);
					}}
				>
					<option value={3}>3</option>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={15}>15</option>
				</select>
			</div>
		</div>
	);
};

export default PaginationControls;
