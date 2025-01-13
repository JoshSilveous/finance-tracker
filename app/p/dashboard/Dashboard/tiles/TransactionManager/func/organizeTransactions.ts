import { SortOrder, Data } from '../../../hooks'

export function sortTransactions(
	sortOrder: SortOrder.State,
	transactions: Data.StateTransaction[]
) {
	const sortedDates = Object.entries(sortOrder)
		.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
		.reverse()
	const res = sortedDates.map((entry) => {
		return {
			date: entry[0],
			transactions: entry[1].map((sortID) => {
				if (Array.isArray(sortID)) {
					const sortedItems: Data.StateTransaction['items'] = []
					const thisTransaction = transactions.find(
						(item) => item.id === sortID[0]
					)!

					sortID.forEach((itemID, index) => {
						if (index === 0) return
						sortedItems.push(
							thisTransaction.items.find((it) => it.id === itemID)!
						)
					})
					return { ...thisTransaction, items: sortedItems }
				} else {
					return transactions.find((trn) => trn.id === sortID)!
				}
			}),
		}
	}) as GroupedTransaction[]
	return res
}
/**
 * Transaction(s), grouped by date
 */
export type GroupedTransaction = { date: string; transactions: Data.StateTransaction[] }
