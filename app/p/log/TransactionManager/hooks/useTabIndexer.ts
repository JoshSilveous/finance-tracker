export function useTabIndexer(startingNum: number) {
	let tabIndex = startingNum - 1
	return (() => {
		tabIndex++
		return tabIndex
	}) as TabIndexer
}

/**
 * Returns the current tabIndex, and increments it for the next node.
 */
export type TabIndexer = () => number
