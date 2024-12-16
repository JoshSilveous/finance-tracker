/**
 * Checks if the two provided parameters are equal. These can be objects, arrays, or any primitive.
 * Compares by content, NOT reference. So arrays/objects provided (or nested) will be compared value-by-value
 */
export function areDeeplyEqual(obj1: any, obj2: any): boolean {
	if (
		typeof obj1 !== 'object' ||
		typeof obj2 !== 'object' ||
		obj1 === null ||
		obj2 === null
	) {
		return obj1 === obj2
	}

	if (Array.isArray(obj1) && Array.isArray(obj2)) {
		if (obj1.length !== obj2.length) {
			return false
		}
		return obj1.every((item, index) => areDeeplyEqual(item, obj2[index]))
	}

	if (Array.isArray(obj1) || Array.isArray(obj2)) {
		return false
	}

	const keys1 = Object.keys(obj1)
	const keys2 = Object.keys(obj2)

	if (keys1.length !== keys2.length) {
		return false
	}

	return keys1.every(
		(key) => obj2.hasOwnProperty(key) && areDeeplyEqual(obj1[key], obj2[key])
	)
}
