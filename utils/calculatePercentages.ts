/**
 * Given an array of numbers, returns an array of 100-based percentages those numbers take up of their sum. Undefined indexes in the array are ignored, but passed back when returned (to keep indexes consistent).
 * You can also pass a `total` to this function, which will be used to calculate percentages (instead of the sum)
 *
 * @example ```
 * calculatePercentages([60,50,undefined,20,70]) === [30,25,undefined,10,35]
 * ```
 */
export function calculatePercentages<T extends (number | undefined)[]>(
	numbers: T,
	total?: number
): T extends number[] ? number[] : (number | undefined)[] {
	const validNumbers = numbers.filter((num): num is number => num !== undefined)
	if (total === undefined) {
		total = validNumbers.reduce((sum, num) => sum + num, 0)
	}

	const result = numbers.map((num) =>
		num === undefined ? undefined : (num / total) * 100
	)

	return result as T extends number[] ? number[] : (number | undefined)[]
}
