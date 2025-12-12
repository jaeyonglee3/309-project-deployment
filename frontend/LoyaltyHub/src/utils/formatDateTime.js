export const formatDateTime = (isoString) => {
	const date = new Date(isoString);
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true
	}).format(date);
};
