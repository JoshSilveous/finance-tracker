export function arraysAreEqual(array1: any[], array2: any[]) {
	if (array1.length !== array2.length) return false
	return array1.every((elem, index) => elem === array2[index])
}
