export function removeFromArray(array: any[], index: number) {
	return array.filter((_, thisIndex) => thisIndex !== index)
}
