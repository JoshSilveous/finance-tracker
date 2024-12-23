import { delay, moveItemInArray } from '@/utils'
import {
	Dispatch,
	KeyboardEventHandler,
	SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
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
	const [defSortOrder, setDefSortOrder] = useState<SortOrder.State>({})
	const [curSortOrder, setCurSortOrder] = useState<SortOrder.State>({})
	const curSortOrderRef = useRef<SortOrder.State | null>(null)
	useEffect(() => {
		curSortOrderRef.current = curSortOrder
	}, [curSortOrder])

	const [transactionToFocusOn, setTransactionToFocusOn] = useState('')
	const transactionReorderRefs = useRef<{ [id: string]: HTMLElement }>({})
	const addToTransactionReorderRefs =
		(date: string, transaction_id: string, transactionIndex: number) =>
		(node: HTMLElement | null) => {
			if (node !== null && transactionReorderRefs.current[transaction_id] !== node) {
				transactionReorderRefs.current[transaction_id] = node

				// add key listener
				node.addEventListener('keydown', (e) => {
					if (e.key === 'ArrowUp' && transactionIndex !== 0) {
						updateTransactionSortOrder(date)(
							transactionIndex,
							transactionIndex - 1
						)
						setTransactionToFocusOn(transaction_id)
					} else if (
						e.key === 'ArrowDown' &&
						transactionIndex !== curSortOrderRef.current![date].length - 1
					) {
						updateTransactionSortOrder(date)(
							transactionIndex,
							transactionIndex + 1
						)
						setTransactionToFocusOn(transaction_id)
					}
				})
			} else {
				console.log('node not pushed')
			}
		}
	useEffect(() => {
		if (transactionToFocusOn !== '') {
			transactionReorderRefs.current[transactionToFocusOn].focus()
			setTransactionToFocusOn('')
		}
	}, [transactionToFocusOn])

	/**
	 * Updates the sort order of an item within a transaction
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
		addToTransactionReorderRefs,
	} as SortOrder.Controller
}

export namespace SortOrder {
	/**
	 * Can either be a string (representing the transaction_id of a single-item) or an array of string (with the first item representing the transaction_id of a multi-item, and the following items representing the item_ids)
	 *
	 * @example ```ts
	 * const sortItems: SortOrderItem[] = ['single_1', 'single_2', ['multi_1', 'item_1', 'item_2', ...], 'single_3', ...]
	 * ```
	 */
	export type Item = string | string[]

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
	export type State = {
		[date: string]: Item[]
	}

	/**
	 * An object that contains methods used to manipulate sort order.
	 */
	export type Controller = {
		/**
		 * Sets the default sort order for TransactionManager
		 */
		setDefault: Dispatch<SetStateAction<State>>
		/**
		 * Sets the current sort order for TransactionManager
		 */
		setCurrent: Dispatch<SetStateAction<State>>
		/**
		 * The current sort order
		 */
		cur: State
		/**
		 * The default sort order
		 */
		def: State

		/**
		 * Generates an {@link ItemUpdater `ItemUpdater`} function that is used to update an item's position in the parent transaction's sort order
		 * @param transaction The parent transaction of the items that will use the `ItemUpdater`
		 * @param transactionIndex  The index of the parent transaction of the items that will use the `ItemUpdater`
		 * @returns an {@link ItemUpdater `ItemUpdater`} function
		 */
		updateItem: (transaction: FormTransaction, transactionIndex: number) => ItemUpdater
		/**
		 * Generates a {@link TransactionUpdater `TransactionUpdater`} function that is used to update a transaction's position in the sort order
		 * @param date the date that this transaction exists under
		 * @returns a {@link TransactionUpdater `TransactionUpdater`} function
		 */
		updateTransaction: (date: string) => TransactionUpdater
		/**
		 * Generates a {@link TransactionReorderRefAdder `TransactionReorderRefAdder`} function that is meant to be applied to every Transaction Reorder button ref.
		 *
		 * This will add a keydown listener that allows reordering using the up/down arrow keys.
		 * @param date The date this transaction exists within
		 * @param transaction_id The ID of this transaction
		 * @param transactionIndex The index of this transaction (within this date)
		 * @returns a {@link TransactionReorderRefAdder `TransactionReorderRefAdder`} function
		 */
		addToTransactionReorderRefs: (
			date: string,
			transaction_id: string,
			transactionIndex: number
		) => TransactionReorderRefAdder
	}
	/**
	 * Used to update an item's position within it's parent's sort order. This function is generated by the {@link SortOrderController.updateItem `updateItem`} method.
	 */
	export type ItemUpdater = (oldItemIndex: number, newItemIndex: number) => void

	/**
	 * Used to update a transaction's position in the sort order. This function is generated by the {@link SortOrderController.updateTransaction `updateItem`} method.
	 */
	export type TransactionUpdater = (oldIndex: number, newIndex: number) => void

	/**
	 * Apply to the `ref` attribute of the buttons used to control Transaction sort order position.
	 */
	export type TransactionReorderRefAdder = (node: HTMLElement | null) => void
}
