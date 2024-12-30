import { useCallback, useEffect, useState } from 'react'
import { FormTransaction } from '../TransactionManager'
import { SortOrder } from './useSortOrder'

export interface UsePendingChangesProps {
	sortOrder: SortOrder.Controller
	afterItemDeletion: (id: string) => void
	afterTransactionDeletion: (id: string) => void
	afterItemDeletionReversed: (id: string) => void
	afterTransactionDeletionReversed: (id: string) => void
}
export function usePendingChanges({
	sortOrder,
	afterItemDeletion,
	afterTransactionDeletion,
	afterItemDeletionReversed,
	afterTransactionDeletionReversed,
}: UsePendingChangesProps) {
	const [pendingChanges, setPendingChanges] = useState<
		PendingChangeController['changes']['cur']
	>({
		transactions: {},
		items: {},
	})
	const [pendingDeletions, setPendingDeletions] = useState<
		PendingChangeController['deletions']['cur']
	>({ transactions: [], items: [] })

	const [pendingCreations, setPendingCreations] = useState<
		PendingChangeController['creations']['cur']
	>({ transactions: null, items: [] })

	const updateChange: PendingChangeController['changes']['set'] = useCallback(
		<T extends keyof PendingChangeController['changes']['cur']>(
			type: T,
			id: string,
			key: keyof PendingChangeController['changes']['cur'][T][number],
			value?: string
		) => {
			setPendingChanges((prev) => {
				const clone = structuredClone(prev)
				const target = clone[type] as Record<
					string,
					Partial<PendingChangeController['changes']['cur'][T][number]>
				>

				if (value !== undefined) {
					target[id] ||= {}
					target[id][key] =
						value as PendingChangeController['changes']['cur'][T][number][typeof key]
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

	const addDeletion: PendingChangeController['deletions']['add'] = (
		type,
		id,
		dontAddToHistory
	) => {
		setPendingDeletions((prev) => {
			const clone = structuredClone(prev)
			type === 'item' ? clone.items.push(id) : clone.transactions.push(id)
			return clone
		})
		if (!dontAddToHistory) {
			type === 'item' ? afterItemDeletion(id) : afterTransactionDeletion(id)
		}
	}

	const removeDeletion: PendingChangeController['deletions']['remove'] = (
		type,
		id,
		dontAddToHistory
	) => {
		setPendingDeletions((prev) => {
			const clone = structuredClone(prev)
			if (type === 'item') {
				const index = clone.items.findIndex((item_id) => item_id === id)
				// if (index !== -1) {
				clone.items.splice(index, 1)
				// }
			} else {
				const index = clone.transactions.findIndex(
					(transaction_id) => transaction_id === id
				)
				// if (index !== -1) {
				clone.transactions.splice(index, 1)
				// }
			}
			return clone
		})
		if (!dontAddToHistory) {
			type === 'item'
				? afterItemDeletionReversed(id)
				: afterTransactionDeletionReversed(id)
		}
	}

	const addCreation: PendingChangeController['creations']['add'] = (
		type,
		position,
		item
	) => {
		if (type === 'item') {
			const temporary_item_id = 'PENDING_CREATION||' + crypto.randomUUID()

			const newItem = item
				? { ...item, id: temporary_item_id, transaction_id: position.transaction_id }
				: {
						order_position: 0,
						name: '',
						amount: '',
						account_id: null,
						category_id: null,
						id: temporary_item_id,
						transaction_id: position.transaction_id,
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
	const removeCreation: PendingChangeController['creations']['remove'] = (
		type,
		id,
		transaction_id,
		date
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

	const isCreation: PendingChangeController['creations']['check'] = (id) => {
		return id.split('||')[0] === 'PENDING_CREATION'
	}

	const clearAll: PendingChangeController['clear'] = useCallback(() => {
		setPendingChanges({
			transactions: {},
			items: {},
		})
		setPendingCreations({ transactions: null, items: [] })
		setPendingDeletions({ transactions: [], items: [] })
	}, [])

	const isChanges = (() => {
		if (
			Object.keys(pendingChanges.transactions).length !== 0 ||
			Object.keys(pendingChanges.items).length !== 0 ||
			pendingDeletions.transactions.length !== 0 ||
			pendingDeletions.items.length !== 0 ||
			pendingCreations.items.length !== 0
		) {
			return true
		} else {
			return false
		}
	})()

	return {
		changes: {
			cur: pendingChanges,
			set: updateChange,
		},
		deletions: {
			cur: pendingDeletions,
			add: addDeletion,
			remove: removeDeletion,
		},
		creations: {
			cur: pendingCreations,
			add: addCreation,
			remove: removeCreation,
			check: isCreation,
		},
		clear: clearAll,
		isChanges: isChanges,
	} as PendingChangeController
}

export type ItemWithoutID = Omit<FormTransaction['items'][number], 'id'>
export type ItemWithoutIDAndPosition = Omit<
	FormTransaction['items'][number],
	'id' | 'order_position'
>

export type TransactionWithoutIDAndPosition = Omit<
	FormTransaction,
	'id' | 'items' | 'order_position'
>
export type PendingChangeController = {
	changes: {
		/**
		 * An object that stores any pending changes the user made to the Transaction data. Keys for the `transactions` and `items` properties are added/removed dynamically using a {@link PendingChangeController["changes"]["set"] `PendingChangeUpdater`}.
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
		cur: {
			transactions: {
				[id: string]: Partial<TransactionWithoutIDAndPosition>
			}
			items: {
				[id: string]: Partial<ItemWithoutIDAndPosition>
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
		set: <T extends keyof PendingChangeController['changes']['cur']>(
			type: T,
			id: string,
			key: keyof PendingChangeController['changes']['cur'][T][number],
			value?: string
		) => void
	}
	deletions: {
		cur: {
			transactions: string[]
			items: string[]
		}
		add: (type: 'item' | 'transaction', id: string, dontAddToHistory?: boolean) => void
		remove: (
			type: 'item' | 'transaction',
			id: string,
			dontAddToHistory?: boolean
		) => void
	}
	creations: {
		cur: {
			transactions: null
			items: { id: string; transaction_id: string }[]
		}
		add: (
			type: 'item' | 'transaction',
			position: {
				rel: 'above' | 'below'
				item_id: string
				date: string
				transaction_id: string
			},
			item?: ItemWithoutID
		) => void
		remove: (
			type: 'item' | 'transaction',
			id: string,
			transaction_id: string,
			date: string
		) => void

		check: (id: string) => boolean
	}
	clear: () => void
	isChanges: boolean
}
