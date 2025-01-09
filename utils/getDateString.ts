export function getDateString(offset: number = 0) {
	const date = new Date()
	date.setDate(date.getDate() + offset)
	return date.toLocaleDateString('en-CA')
}
