import { PendingChanges } from '../hooks'
import { SortOrder } from '../hooks/useSortOrder'
import { GroupedTransaction, FormTransaction } from '../TransactionManager'

export function sortTransactions(
	sortOrder: SortOrder.State,
	transactionData: FormTransaction[],
	pendingChanges: PendingChanges.Controller
) {
	return Object.entries(sortOrder).map((entry) => {
		return {
			date: entry[0],
			transactions: entry[1].map((sortItem) => {
				if (Array.isArray(sortItem)) {
					const newItems: FormTransaction['items'] = []
					const thisTransaction = transactionData.find(
						(item) => item.id === sortItem[0]
					)!

					sortItem.forEach((itemID, index) => {
						if (index === 0) return
						if (pendingChanges.isCreation(itemID)) {
							newItems.push(
								pendingChanges.curCreations.items.find(
									(item) => item.id === itemID
								)!
							)
						} else {
							newItems.push(
								thisTransaction.items.find((item) => item.id === itemID)!
							)
						}
					})
					return { ...thisTransaction, items: newItems }
				} else {
					return transactionData.find((item) => item.id === sortItem)!
				}
			}),
		}
	}) as GroupedTransaction[]
}
