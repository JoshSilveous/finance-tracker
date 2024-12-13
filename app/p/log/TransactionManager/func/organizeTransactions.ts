import { FetchedTransaction } from '@/database'
import { GroupedTransaction, SortOrder } from '../TransactionManager'

export function sortTransactions(
	sortOrder: SortOrder,
	transactionData: FetchedTransaction[]
) {
	return Object.entries(sortOrder).map((entry) => {
		return {
			date: entry[0],
			transactions: entry[1].map((sortItem) => {
				if (Array.isArray(sortItem)) {
					const newItems: FetchedTransaction['items'] = []
					const thisTransaction = transactionData.find(
						(item) => item.id === sortItem[0]
					)!

					sortItem.forEach((itemID, index) => {
						if (index === 0) return
						newItems.push(
							thisTransaction.items.find((item) => item.id === itemID)!
						)
					})
					return { ...thisTransaction, items: newItems }
				} else {
					return transactionData.find((item) => item.id === sortItem)!
				}
			}),
		}
	}) as GroupedTransaction[]
}
