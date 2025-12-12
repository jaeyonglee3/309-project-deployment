export const formatPercentage = (decimal) => {
	if (decimal == null || isNaN(decimal)) return "";
	const value = decimal * 100;
	return `${value}%`;
};
