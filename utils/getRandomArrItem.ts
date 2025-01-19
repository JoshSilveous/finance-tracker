/**
 * Provided an array, returns a random item within that array.
 */
export function getRandomArrItem<T>(arr: T[]): T {
	const randomIndex = Math.floor(Math.random() * arr.length)
	return arr[randomIndex]
}
