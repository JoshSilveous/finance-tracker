import { moveItemInArray } from '@/utils'
import {
	Dispatch,
	MutableRefObject,
	SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { FormTransaction, TransactionRowsRef } from '../../TransactionManager'
import { ItemRowRefs } from '../../components'
import { itemReorderMouseEffect } from './handleItemReorder'
import { FoldStateGetter, FoldStateUpdater } from '../useFoldState'
import { transactionReorderMouseEffect } from './handleTransactionReorder'

export interface UseSortOrderProps {
	getFoldState: FoldStateGetter
	updateFoldState: FoldStateUpdater
	transactionRowsRef: MutableRefObject<TransactionRowsRef>
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
	getFoldState,
	updateFoldState,
	transactionRowsRef,
	afterTransactionPositionChange,
	afterItemPositionChange,
}: UseSortOrderProps) {
	const [defSortOrder, setDefSortOrder] = useState<SortOrder.State>({})
	const [curSortOrder, setCurSortOrder] = useState<SortOrder.State>({})
	const curSortOrderRef = useRef<SortOrder.State | null>(null)
	useEffect(() => {
		curSortOrderRef.current = curSortOrder
	}, [curSortOrder])

	/* TRANSACTION REORDERING LOGIC */

	// used to re-gain focus on the reorder node after re-renders
	const transactionToFocusOnRef = useRef<string>('')
	// const [transactionToFocusOn, setTransactionToFocusOn] = useState('')
	// useEffect(() => {
	// 	if (transactionToFocusOn !== '') {
	// 		transactionReorderRefs.current[transactionToFocusOn].focus()
	// 		setTransactionToFocusOn('')
	// 	}
	// }, [transactionToFocusOn])
	useEffect(() => {
		if (transactionToFocusOnRef.current !== '') {
			transactionReorderRefs.current[transactionToFocusOnRef.current].focus()
			transactionToFocusOnRef.current = ''
		}
	}, [transactionToFocusOnRef.current])

	// holds references to all of the transaction reorder buttons
	const transactionReorderRefs = useRef<{ [id: string]: HTMLElement }>({})
	const handleTransactionReorderKeydown = useCallback(
		(transaction: FormTransaction) => (e: KeyboardEvent) => {
			const transactionIndex = curSortOrderRef.current![transaction.date].findIndex(
				(sortItem) => Array.isArray(sortItem) && sortItem[0] === transaction.id
			)

			if (e.key === 'ArrowUp' && transactionIndex !== 0) {
				updateTransactionSortOrder(
					transaction.date,
					transactionIndex,
					transactionIndex - 1
				)
				// setTransactionToFocusOn(transaction.id)
				transactionToFocusOnRef.current = transaction.id
			} else if (
				e.key === 'ArrowDown' &&
				transactionIndex !== curSortOrderRef.current![transaction.date].length - 1
			) {
				updateTransactionSortOrder(
					transaction.date,
					transactionIndex,
					transactionIndex + 1
				)
				// setTransactionToFocusOn(transaction.id)
				transactionToFocusOnRef.current = transaction.id
			}
		},
		[]
	)
	const handleTransactionReorderMousedown = useCallback(
		(transaction: FormTransaction) => (e: MouseEvent) => {
			const transactionIndex = curSortOrderRef.current![transaction.date].findIndex(
				(sortItem) => Array.isArray(sortItem) && sortItem[0] === transaction.id
			)
			const folded = getFoldState(transaction.id)

			return transactionReorderMouseEffect(
				transaction,
				transactionIndex,
				curSortOrderRef.current![transaction.date],
				transactionRowsRef,
				folded,
				updateFoldState,
				e,
				(oldIndex, newIndex) => {
					updateTransactionSortOrder(transaction.date, oldIndex, newIndex)
					// setTransactionToFocusOn(transaction.id)
					transactionToFocusOnRef.current = transaction.id
				}
			)
		},
		[]
	)
	// applied to each transaction reorder node
	const addToTransactionReorderRefs = useCallback(
		(transaction: FormTransaction) => (node: HTMLElement | null) => {
			if (node !== null && transactionReorderRefs.current[transaction.id] !== node) {
				transactionReorderRefs.current[transaction.id] = node

				node.addEventListener(
					'keydown',
					handleTransactionReorderKeydown(transaction)
				)
				node.addEventListener(
					'mousedown',
					handleTransactionReorderMousedown(transaction)
				)
			}
		},
		[]
	)
	/* END TRANSACTION REORDERING LOGIC */
	//
	//
	//
	/* ITEM REORDERING LOGIC */

	// used to re-gain focus on the reorder node after re-renders
	const [itemToFocusOn, setItemToFocusOn] = useState<{
		transaction_id: string
		item_id: string
	} | null>(null)
	useEffect(() => {
		if (itemToFocusOn !== null) {
			const { transaction_id, item_id } = itemToFocusOn
			itemReorderRefs.current[transaction_id][item_id].focus()
			setItemToFocusOn(null)
		}
	}, [itemToFocusOn])

	// holds references to all of the item reorder buttons
	const itemReorderRefs = useRef<{
		[transaction_id: string]: { [item_id: string]: HTMLElement }
	}>({})
	const handleItemReorderKeydown = useCallback(
		(transaction: FormTransaction, item: FormTransaction['items'][number]) =>
			(e: KeyboardEvent) => {
				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					const transactionIndex = curSortOrderRef.current![
						transaction.date
					].findIndex(
						(sortItem) =>
							Array.isArray(sortItem) && sortItem[0] === transaction.id
					)

					const itemIndex =
						(
							curSortOrderRef.current![transaction.date][
								transactionIndex
							] as string[]
						).findIndex((sortItem) => sortItem === item.id) - 1

					if (e.key === 'ArrowUp' && itemIndex !== 0) {
						updateItemSortOrder(
							transaction,
							transactionIndex,
							itemIndex,
							itemIndex - 1
						)
						setItemToFocusOn({
							transaction_id: transaction.id,
							item_id: item.id,
						})
					} else if (
						e.key === 'ArrowDown' &&
						itemIndex !==
							(
								curSortOrderRef.current![transaction.date][
									transactionIndex
								] as string[]
							).length -
								2
					) {
						updateItemSortOrder(
							transaction,
							transactionIndex,
							itemIndex,
							itemIndex + 1
						)
						setItemToFocusOn({
							transaction_id: transaction.id,
							item_id: item.id,
						})
					}
				}
			},
		[]
	)
	const handleItemReorderMousedown = useCallback(
		(
				transaction: FormTransaction,
				item: FormTransaction['items'][number],
				itemRowsRef: MutableRefObject<ItemRowRefs>
			) =>
			(e: MouseEvent) => {
				const transactionIndex = curSortOrderRef.current![
					transaction.date
				].findIndex(
					(sortItem) => Array.isArray(sortItem) && sortItem[0] === transaction.id
				)

				const itemIndex = (
					curSortOrderRef.current![transaction.date][transactionIndex] as string[]
				).findIndex((sortItem) => sortItem === item.id)

				return itemReorderMouseEffect(
					item,
					itemRowsRef.current,
					itemIndex - 1,
					transaction,
					e,
					(oldIndex, newIndex) => {
						updateItemSortOrder(
							transaction,
							transactionIndex,
							oldIndex,
							newIndex
						)
						setItemToFocusOn({
							transaction_id: transaction.id,
							item_id: item.id,
						})
					}
				)
			},
		[]
	)
	// applied to each item reorder node
	const addToItemReorderRefs = useCallback(
		(
				transaction: FormTransaction,
				item: FormTransaction['items'][number],
				itemRowsRef: MutableRefObject<ItemRowRefs>
			) =>
			(node: HTMLElement | null) => {
				if (node !== null) {
					itemReorderRefs.current[transaction.id] ||= {}

					if (itemReorderRefs.current[transaction.id][item.id] !== node) {
						itemReorderRefs.current[transaction.id][item.id] = node

						node.addEventListener(
							'keydown',
							handleItemReorderKeydown(transaction, item)
						)
						node.addEventListener(
							'mousedown',
							handleItemReorderMousedown(transaction, item, itemRowsRef)
						)
					}
				}
			},
		[]
	)

	/* END ITEM REORDERING LOGIC */

	const updateItemSortOrder = useCallback(
		(
			transaction: FormTransaction,
			transactionIndex: number,
			oldItemIndex: number,
			newItemIndex: number
		) => {
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
		(date: string, oldIndex: number, newIndex: number) => {
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
		addToTransactionReorderRefs,
		addToItemReorderRefs,
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
		 * Generates a {@link TransactionReorderRefAdder `TransactionReorderRefAdder`} function that is meant to be applied to every Transaction Reorder button ref.
		 *
		 * This will add a keydown listener that allows reordering using the up/down arrow keys, as well as a mousedown listener for drag-and-drop reordering.
		 * @param date The date this transaction exists within
		 * @param transaction_id The ID of this transaction
		 * @param transactionIndex The index of this transaction (within this date)
		 * @returns a {@link TransactionReorderRefAdder `TransactionReorderRefAdder`} function
		 */
		addToTransactionReorderRefs: (
			transaction: FormTransaction
		) => TransactionReorderRefAdder

		/**
		 * Generates a {@link ItemReorderRefAdder `ItemReorderRefAdder`} function that is meant to be applied to every Item Reorder button ref.
		 *
		 * This will add a keydown listener that allows reordering using the up/down arrow keys, as well as a mousedown listener for drag-and-drop reordering.
		 * @param transaction The transaction this item belongs to
		 * @param item The item this button is referencing
		 * @param itemRowsRef The `ref` of all of the item row nodes, used in drag-and-drop resorting logic
		 * @returns a {@link ItemReorderRefAdder `ItemReorderRefAdder`} function
		 */
		addToItemReorderRefs: (
			transaction: FormTransaction,
			item: FormTransaction['items'][number],
			itemRowsRef: MutableRefObject<ItemRowRefs>
		) => (node: HTMLElement | null) => void
	}

	/**
	 * Apply to the `ref` attribute of the buttons used to control Transaction sort order position.
	 */
	export type TransactionReorderRefAdder = (node: HTMLElement | null) => void

	/**
	 * Apply to the `ref` attribute of the buttons used to control Item sort order position.
	 */
	export type ItemReorderRefAdder = (node: HTMLElement | null) => void
}
