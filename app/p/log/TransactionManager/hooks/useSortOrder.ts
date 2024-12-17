import { moveItemInArray } from '@/utils'
import { useCallback, useState } from 'react'
import { FormTransaction } from '../TransactionManager'

export interface UseSortOrderProps {
	afterTransactionPositionChange: (
		date: string,
		oldIndex: number,
		newIndex: number
	) => void
	afterItemPositionChange: (
		transaction: FormTransaction,
		oldIndex: number,
		newIndex: number
	) => void
}

export function useSortOrder({
	afterTransactionPositionChange,
	afterItemPositionChange,
}: UseSortOrderProps) {
	const [defSortOrder, setDefSortOrder] = useState<SortOrder>({})
	const [curSortOrder, setCurSortOrder] = useState<SortOrder>({})

	/**
	 * Updated the sort order of an item within a transaction
	 * @param transaction
	 */
	const updateItemSortOrder = useCallback(
		(transaction: FormTransaction, transactionIndex: number) =>
			(oldItemIndex: number, newItemIndex: number) => {
				setCurSortOrder((prev) => {
					const clone = structuredClone(prev)

					const thisTransactionOrder = clone[transaction.date][
						transactionIndex
					] as string[]

					moveItemInArray(thisTransactionOrder, oldItemIndex + 1, newItemIndex + 1)

					return clone
				})
				afterItemPositionChange(transaction, oldItemIndex, newItemIndex)
			},
		[]
	)

	const updateTransactionSortOrder = useCallback(
		(date: string) => (oldIndex: number, newIndex: number) => {
			setCurSortOrder((prev) => {
				const clone = structuredClone(prev)

				moveItemInArray(clone[date], oldIndex, newIndex)

				return clone
			})
			afterTransactionPositionChange(date, oldIndex, newIndex)
		},
		[]
	)
	return {
		setDefault: setDefSortOrder,
		setCurrent: setCurSortOrder,
		cur: curSortOrder,
		def: defSortOrder,
		updateItem: updateItemSortOrder,
		updateTransaction: updateTransactionSortOrder,
	}
}

/**
 * Can either be a string (representing the transaction_id of a single-item) or an array of string (with the first item representing the transaction_id of a multi-item, and the following items representing the item_ids)
 *
 * @example ```ts
 * const sortItems: SortOrderItem[] = ['single_1', 'single_2', ['multi_1', 'item_1', 'item_2', ...], 'single_3', ...]
 * ```
 */
export type SortOrderItem = string | string[]

/**
 * An object that keeps the sort order, keyed by `date`.
 *
 * @example
 * ```ts
 * const sortOrder: SortOrder = {
 *     "2024-12-03": ['transaction_1', 'transaction_2'],
 *     "2024-12-02": [['transaction_3', 'item_1', 'item_2'], 'transaction_4']
 * }
 * ```
 *
 */
export type SortOrder = {
	[date: string]: SortOrderItem[]
}
