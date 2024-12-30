/**
 * Moves an item in an array from one index to another, mutating the original array
 * @param array The array to be mutated
 * @param fromIndex The index of the item to be moved
 * @param toIndex The index to insert the item
 * @returns
 */
export function moveItemInArray(array: Array<any>, fromIndex: number, toIndex: number) {
	const item = array.splice(fromIndex, 1)[0]
	array.splice(toIndex, 0, item)
	return
}
