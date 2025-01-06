import { SortOrder, Data } from '../../../hooks'

export function sortTransactions(
	sortOrder: SortOrder.State,
	transactions: Data.StateTransaction[]
) {
	const res = Object.entries(sortOrder).map((entry) => {
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
	console.log('input:\n', transactions, sortOrder)
	console.log('output:\n', res)
	return res
}
/**
 * Transaction(s), grouped by date
 */
export type GroupedTransaction = { date: string; transactions: Data.StateTransaction[] }
