import { useCallback, useEffect, useState } from 'react'
import { FormTransaction } from '../TransactionManager'

export function usePendingChanges() {
	const [pendingChanges, setPendingChanges] = useState<PendingChanges.State>({
		transactions: {},
		items: {},
	})
	const [pendingDeletions, setPendingDeletions] = useState<{
		transactions: string[]
		items: string[]
	}>({ transactions: [], items: [] })

	const updateChange: PendingChanges.Updater = useCallback(
		<T extends keyof PendingChanges.State>(
			type: T,
			id: string,
			key: keyof PendingChanges.State[T][number],
			value?: string
		) => {
			setPendingChanges((prev) => {
				const clone = structuredClone(prev)
				const target = clone[type] as Record<
					string,
					Partial<PendingChanges.State[T][number]>
				>

				if (value !== undefined) {
					target[id] ||= {}
					target[id][key] = value as PendingChanges.State[T][number][typeof key]
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

	const addDeletion = (type: 'item' | 'transaction', id: string) => {
		setPendingDeletions((prev) => {
			const clone = structuredClone(prev)
			if (type === 'item') {
				clone.items.push(id)
			} else {
				clone.transactions.push(id)
			}
			return clone
		})
	}

	const removeDeletion = (type: 'item' | 'transaction', id: string) => {
		setPendingDeletions((prev) => {
			const clone = structuredClone(prev)
			if (type === 'item') {
				const index = clone.items.findIndex((item_id) => item_id === id)
				if (index !== -1) {
					clone.items.splice(index, 1)
				}
			} else {
				const index = clone.transactions.findIndex(
					(transaction_id) => transaction_id === id
				)
				if (index !== -1) {
					clone.transactions.splice(index, 1)
				}
			}
			return clone
		})
	}

	const clearAll = useCallback(() => {
		setPendingChanges({
			transactions: {},
			items: {},
		})
	}, [])

	return {
		curChanges: pendingChanges,
		updateChange,
		clearAll,
		curDeletions: pendingDeletions,
		addDeletion,
		removeDeletion,
	} as PendingChanges.Controller
}

export namespace PendingChanges {
	/**
	 * An object that stores any pending changes the user made to the Transaction data. Keys for the `transactions` and `items` properties are added/removed dynamically using a {@link Updater `PendingChangeUpdater`}.
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
	export type State = {
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
	export type Updater = <T extends keyof State>(
		type: T,
		id: string,
		key: keyof State[T][number],
		value?: string
	) => void

	export type Controller = {
		/**
		 * An object that stores any pending changes the user made to the Transaction data. Keys for the `transactions` and `items` properties are added/removed dynamically using a {@link Updater `PendingChangeUpdater`}.
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
		curChanges: State
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
		updateChange: Updater
		clearAll: Clearer
		curDeletions: {
			transactions: string[]
			items: string[]
		}
		addDeletion: (type: 'item' | 'transaction', id: string) => void
		removeDeletion: (type: 'item' | 'transaction', id: string) => void
	}

	/**
	 * Clears the pendingChange state
	 */
	export type Clearer = () => void
}
