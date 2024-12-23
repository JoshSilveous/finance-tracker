import { PendingChanges } from '../../hooks'
import { FormTransaction } from '../../TransactionManager'

export type LiveVals = {
	date: { val: string; changed: boolean }
	name: { val: string; changed: boolean }
	items: {
		[item_id: string]: {
			name: { val: string; changed: boolean }
			amount: { val: string; changed: boolean }
			category_id: { val: string | null; changed: boolean }
			account_id: { val: string | null; changed: boolean }
		}
	}
}
/**
 * Packages together transaction / pendingChange data for easy access / management
 */
export function genLiveVals(transaction: FormTransaction, pendingChanges: PendingChanges) {
	const transaction_id = transaction.id
	return {
		date: {
			val:
				pendingChanges.transactions[transaction_id] !== undefined &&
				pendingChanges.transactions[transaction_id].date !== undefined
					? pendingChanges.transactions[transaction_id].date
					: transaction.date,
			changed:
				pendingChanges.transactions[transaction_id] !== undefined &&
				pendingChanges.transactions[transaction_id].date !== undefined,
		},
		name: {
			val:
				pendingChanges.transactions[transaction_id] !== undefined &&
				pendingChanges.transactions[transaction_id].name !== undefined
					? pendingChanges.transactions[transaction_id].name
					: transaction.name,
			changed:
				pendingChanges.transactions[transaction_id] !== undefined &&
				pendingChanges.transactions[transaction_id].name !== undefined,
		},
		items: transaction.items.reduce((acc, item) => {
			acc[item.id] = {
				name: {
					val:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].name !== undefined
							? pendingChanges.items[item.id].name!
							: item.name,
					changed:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].name !== undefined,
				},
				amount: {
					val:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].amount !== undefined
							? pendingChanges.items[item.id].amount!
							: item.amount,
					changed:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].amount !== undefined,
				},
				category_id: {
					val:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].category_id !== undefined
							? pendingChanges.items[item.id].category_id!
							: item.category_id,
					changed:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].category_id !== undefined,
				},
				account_id: {
					val:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].account_id !== undefined
							? pendingChanges.items[item.id].account_id!
							: item.account_id,
					changed:
						pendingChanges.items[item.id] !== undefined &&
						pendingChanges.items[item.id].account_id !== undefined,
				},
			}
			return acc
		}, {} as LiveVals['items']),
	} as LiveVals
}
