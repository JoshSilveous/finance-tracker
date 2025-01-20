/**
 * Runs a block of code repeatedly until `duration` has passed, repeating every `interval`
 */
export function runRepeatedly(callback: () => void, duration: number, interval: number) {
	const intervalId = setInterval(callback, interval)

	setTimeout(() => {
		clearInterval(intervalId)
	}, duration)
}
