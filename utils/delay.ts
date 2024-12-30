/**
 * Resolves after time is completed
 * @param time In milliseconds
 */
export function delay(time: number) {
	return new Promise((res) => setTimeout(res, time))
}
