export function addCommas(numberString: string) {
	let [wholePart, decimalPart] = numberString.split('.')
	wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
	return decimalPart ? `${wholePart}.${decimalPart}` : wholePart
}
