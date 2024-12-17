import { useCallback, useState } from 'react'
import { FormTransaction } from '../TransactionManager'

export function usePendingChanges() {
	const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
		transactions: {},
		items: {},
	})

	const update: PendingChangeUpdater = useCallback(
		<T extends keyof PendingChanges>(
			type: T,
			id: string,
			key: keyof PendingChanges[T][number],
			value?: string
		) => {
			setPendingChanges((prev) => {
				const clone = structuredClone(prev)
				const target = clone[type] as Record<
					string,
					Partial<PendingChanges[T][number]>
				>

				if (value !== undefined) {
					target[id] ||= {}
					target[id][key] = value as PendingChanges[T][number][typeof key]
				} else if (target[id] !== undefined) {
					delete target[id][key]
					if (Object.keys(target[id]).length === 0) {
						delete target[id]
					}
				} else {
					delete target[id]
				}

				return clone
			})
		},
		[]
	)

	const clear = useCallback(() => {
		setPendingChanges({
			transactions: {},
			items: {},
		})
	}, [])

	return {
		cur: pendingChanges,
		update,
		clear,
	}
}

/**
 * An object that stores any pending changes the user made to the Transaction data. Keys for the `transactions` and `items` properties are added/removed dynamically using a {@link PendingChangeUpdater `PendingChangeUpdater`}.
 *
 * @example
 * ```ts
 * pendingChanges = {
 *     transactions: {
 *         "transaction_1": {
 *             "name": "New Name",
 *             "date": "2024-12-03"
 *         }
 *     },
 *     items: {}
 * }
 * ```
 */
export type PendingChanges = {
	transactions: {
		[id: string]: Partial<Omit<FormTransaction, 'id' | 'items' | 'order_position'>>
	}
	items: {
		[id: string]: Partial<
			Omit<FormTransaction['items'][number], 'id' | 'order_position'>
		>
	}
}

/**
 * Simplifies updating the `pendingChanges` array. Automatically adds/removes changes to keep pendingChanges minimized to relevant information.
 *
 * @param type `'transactions' | 'items'`
 * @param id The `item` or `transaction` id.
 * @param key The key of the item or transaction you're modifying.
 * @param value optional, leaving undefined will delete the value from `pendingChanges`
 *
 * @example
 * ```ts
 * updatePendingChanges('transactions', transaction.id, 'name', 'Burger') // creates/updates "name" for specified transaction as needed
 * updatePendingChanges('items', item.id, 'name') // removes "name" for specified item (implying the user has undone their change)
 * ```
 */
export type PendingChangeUpdater = <T extends keyof PendingChanges>(
	type: T,
	id: string,
	key: keyof PendingChanges[T][number],
	value?: string
) => void
