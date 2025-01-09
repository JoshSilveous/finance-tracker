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
 */
export function getCurDateString(): string {
	return new Date().toLocaleDateString('en-CA') // Local date as "YYYY-MM-DD"
}

/**
 * Returns the local user's current date in `"YYYY-MM-DD"` format, normalized to UTC 00:00:00
 */
export function getCurDate(): Date {
	return parseDateString(getCurDateString())
}
