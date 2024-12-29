import { PendingChangeController } from '../../hooks/usePendingChanges'
import { FormTransaction } from '../../TransactionManager'

export type LiveVals = {
	amount: { val: string; changed: boolean }
	category_id: { val: string | null; changed: boolean }
	account_id: { val: string | null; changed: boolean }
	date: { val: string; changed: boolean }
	name: { val: string; changed: boolean }
}

/**
 * Packages together transaction / pendingChange data for easy access / management
 */
export function genLiveVals(
	transaction: FormTransaction,
	pendingChanges: PendingChangeController['changes']['cur']
) {
	const transaction_id = transaction.id
	const item = transaction.items[0]
	const item_id = item.id
	return {
		amount: {
			val:
				pendingChanges.items[item_id] !== undefined &&
				pendingChanges.items[item_id].amount !== undefined
					? pendingChanges.items[item_id].amount
					: item.amount,
			changed:
				pendingChanges.items[item_id] !== undefined &&
				pendingChanges.items[item_id].amount !== undefined,
		},
		category_id: {
			val:
				pendingChanges.items[item_id] !== undefined &&
				pendingChanges.items[item_id].category_id !== undefined
					? pendingChanges.items[item_id].category_id
					: item.category_id,
			changed:
				pendingChanges.items[item_id] !== undefined &&
				pendingChanges.items[item_id].category_id !== undefined,
		},
		account_id: {
			val:
				pendingChanges.items[item_id] !== undefined &&
				pendingChanges.items[item_id].account_id !== undefined
					? pendingChanges.items[item_id].account_id
					: item.account_id,
			changed:
				pendingChanges.items[item_id] !== undefined &&
				pendingChanges.items[item_id].account_id !== undefined,
		},
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
	} as LiveVals
}
