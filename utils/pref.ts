/**
 * Attempts to set the provided value into localStorage. Any errors thrown are ignored.
 * Use in tandem with {@link getNumPref `getNumPref()`} for seamless integration.
 * @param key The identifier of the value
 * @param value The value that will be stored in localStorage
 */
export function setNumPref(key: string, value: number) {
	try {
		localStorage.setItem(key, value.toString())
		console.log(`setting "${key}" to "${value}"`)
	} catch (e) {}
}

/**
 * Attempts to retrieve the value of the provided key (from localStorage).
 * If that cannot be retrieved, the `fallback` number will be returned.
 * Any errors thrown are ignored.
 * @param key  The identifier of the value
 * @param fallback The value that will be returned if the localStorage value cannot be retrieved.
 */
export function getNumPref(key: string, fallback: number) {
	try {
		const value = localStorage.getItem(key)
		if (value !== null) {
			console.log(`value retrieved for "${key}":`, Number(value))
			return Number(value)
		}
	} catch (e) {}
	return fallback
}
