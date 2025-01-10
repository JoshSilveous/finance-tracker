/**
 * Converts a string in `"YYYY-MM-DD"` format to a `Date` object in UTC format.
 */
export function parseDateString(date: string): Date {
	const [year, month, day] = date.split('-').map(Number)
	return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Converts a `Date` object to a `"YYYY-MM-DD"` string in UTC format.
 */
export function getDateString(date: Date): string {
	return date.toISOString().split('T')[0]
}

/**
 * Returns the local user's current date in `"YYYY-MM-DD"` format.
 * @param offset Add/subtract days from today's date
 */
export function getCurDateString(offset?: number): string {
	const date = new Date()
	if (offset) {
		date.setDate(date.getDate() + offset)
	}
	return date.toLocaleDateString('en-CA')
}

/**
 * Returns the local user's current date in `"YYYY-MM-DD"` format, normalized to UTC 00:00:00
 * @param offset Add/subtract days from today's date
 */
export function getCurDate(offset?: number): Date {
	return parseDateString(getCurDateString(offset))
}
