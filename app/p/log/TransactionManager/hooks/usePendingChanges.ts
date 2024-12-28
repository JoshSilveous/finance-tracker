import { useCallback, useEffect, useState } from 'react'
import { FormTransaction } from '../TransactionManager'
import { SortOrder } from './useSortOrder'

export function usePendingChanges(sortOrder: SortOrder.Controller) {
	const [pendingChanges, setPendingChanges] = useState<PendingChanges.State>({
		transactions: {},
		items: {},
	})
	const [pendingDeletions, setPendingDeletions] = useState<{
		transactions: string[]
		items: string[]
	}>({ transactions: [], items: [] })

	const [pendingCreations, setPendingCreations] = useState<{
		transactions: null
		items: FormTransaction['items']
	}>({ transactions: null, items: [] })

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

	const addCreation = (
		type: 'item' | 'transaction',
		position: {
			rel: 'above' | 'below'
			item_id: string
			date: string
			transaction_id: string
		},
		item?: ItemWithoutID
	) => {
		if (type === 'item') {
			const temporary_item_id = 'PENDING_CREATION||' + crypto.randomUUID()

			const newItem = item
				? { ...item, id: temporary_item_id }
				: {
						order_position: 0,
						name: '',
						amount: '',
						account_id: null,
						category_id: null,
						id: temporary_item_id,
				  }

			setPendingCreations((prev) => {
				const clone = structuredClone(prev)
				clone.items.push(newItem)
				return clone
			})

			sortOrder.setCurrent((prev) => {
				const clone = structuredClone(prev)
				const thisDate = clone[position.date]
				const thisIndex = thisDate.findIndex((sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === position.transaction_id
						: sortItem === position.transaction_id
				)
				const sortItem = thisDate[thisIndex]
				if (Array.isArray(sortItem)) {
					// add item to multi-row
					let insertIndex = sortItem.indexOf(position.item_id)
					if (insertIndex === -1) {
						throw new Error(`couldnt find index $${position.item_id}`)
					}
					if (position.rel === 'below') {
						insertIndex++
					}
					sortItem.splice(insertIndex, 0, temporary_item_id)
				} else {
					// add item to transaction non-multi-row
					thisDate[thisIndex] = [
						position.transaction_id,
						position.item_id,
						temporary_item_id,
					]
				}
				return clone
			})
		}
	}
	const removeCreation = (
		type: 'item' | 'transaction',
		id: string,
		transaction_id: string,
		date: string
	) => {
		if (type === 'item') {
			setPendingChanges((prev) => {
				const clone = structuredClone(prev)
				if (clone.items[id]) {
					delete clone.items[id]
				}
				return clone
			})
			setPendingCreations((prev) => {
				const clone = structuredClone(prev)
				const index = clone.items.findIndex((item) => item.id === id)
				clone.items.splice(index, 1)
				return clone
			})
			sortOrder.setCurrent((prev) => {
				const clone = structuredClone(prev)
				const thisDate = clone[date]
				const thisIndex = thisDate.findIndex((sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === transaction_id
						: sortItem === transaction_id
				)
				const sortItem = thisDate[thisIndex]
				if (Array.isArray(sortItem)) {
					// remove item from multi-row
					let itemIndex = sortItem.indexOf(id)
					if (itemIndex === -1) {
						throw new Error(`couldnt find index $${id}`)
					}
					sortItem.splice(itemIndex, 1)

					if (sortItem.length === 2) {
						thisDate[thisIndex] = transaction_id
					}
				}
				return clone
			})
		}
	}

	const isCreation = (id: string) => {
		return id.split('||')[0] === 'PENDING_CREATION'
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
		isCreation,
		removeDeletion,
		curCreations: pendingCreations,
		addCreation,
		removeCreation,
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
		removeCreation: (
			type: 'item' | 'transaction',
			id: string,
			transaction_id: string,
			date: string
		) => void
		clearAll: Clearer
		isCreation: (id: string) => boolean
		addCreation: (
			type: 'item' | 'transaction',
			position: {
				rel: 'above' | 'below'
				item_id: string
				date: string
				transaction_id: string
			},
			item?: ItemWithoutID
		) => void
		curCreations: {
			transactions: null
			items: FormTransaction['items']
		}
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
type ItemWithoutID = Omit<FormTransaction['items'][number], 'id'>
