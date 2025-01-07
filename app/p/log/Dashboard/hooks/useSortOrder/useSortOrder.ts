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
import { itemReorderMouseEffect } from './handleItemReorder'
import { FoldStateGetter, FoldStateUpdater } from '../useFoldState'
import { transactionReorderMouseEffect } from './handleTransactionReorder'
import { Data } from '../../../Dashboard/hooks/useData/useData'
import { TransactionManagerRowsRef } from '../../Dashboard'
import { ItemRowsRef } from '../../tiles/TransactionManager/components'

export interface UseSortOrderProps {
	getFoldState: FoldStateGetter
	updateFoldState: FoldStateUpdater
	transactionManagerRowsRef: MutableRefObject<TransactionManagerRowsRef>
	afterTransactionPositionChange: (
		date: string,
		oldIndex: number,
		newIndex: number
	) => void
	afterItemPositionChange: (
		transaction: Data.StateTransaction,
		oldIndex: number,
		newIndex: number
	) => void
}

export function useSortOrder({
	getFoldState,
	updateFoldState,
	transactionManagerRowsRef,
	afterTransactionPositionChange,
	afterItemPositionChange,
}: UseSortOrderProps) {
	const [defSortOrder, setDefSortOrder] = useState<SortOrder.State>({})
	const [curSortOrder, setCurSortOrder] = useState<SortOrder.State>({})
	const curSortOrderRef = useRef<SortOrder.State | null>(null)
	useEffect(() => {
		curSortOrderRef.current = curSortOrder
	}, [curSortOrder])

	const changesAreDisabled = useRef<boolean>(false)

	const genDefaultSortOrder = (transactions: Data.StateTransaction[]) => {
		// generate default sort order
		const sortOrder: SortOrder.State = {}
		transactions.forEach((transaction) => {
			if (sortOrder[transaction.date.val] === undefined) {
				if (transaction.items.length > 1) {
					sortOrder[transaction.date.val] = [
						[transaction.id, ...transaction.items.map((item) => item.id)],
					]
				} else {
					sortOrder[transaction.date.val] = [transaction.id]
				}
			} else {
				if (transaction.items.length > 1) {
					sortOrder[transaction.date.val] = [
						...sortOrder[transaction.date.val],
						[transaction.id, ...transaction.items.map((item) => item.id)],
					]
				} else {
					sortOrder[transaction.date.val] = [
						...sortOrder[transaction.date.val],
						transaction.id,
					]
				}
			}
		})

		// flip transactions sort order (so new transactions appear at the top)
		Object.entries(sortOrder).forEach(([date, sortItems]) => {
			sortOrder[date] = sortItems.reverse()
		})
		setDefSortOrder(sortOrder)
		setCurSortOrder(sortOrder)
	}

	/* TRANSACTION REORDERING LOGIC */

	// used to re-gain focus on the reorder node after re-renders
	const transactionToFocusOnRef = useRef<string>('')

	// holds references to all of the transaction reorder buttons
	const newTransactionReorderRefs = useRef<
		{
			transaction_id: string
			node: HTMLButtonElement
			keydownListener: (e: KeyboardEvent) => void
			mousedownListener: (e: MouseEvent) => void
		}[]
	>([])
	const handleTransactionReorderKeydown = useCallback(
		(transaction: Data.StateTransaction) => (e: KeyboardEvent) => {
			if (!changesAreDisabled.current) {
				const transactionIndex = curSortOrderRef.current![
					transaction.date.val
				].findIndex((sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === transaction.id
						: sortItem === transaction.id
				)

				if (e.key === 'ArrowUp' && transactionIndex !== 0) {
					e.preventDefault()
					updateTransactionSortOrder(
						transaction.date.val,
						transactionIndex,
						transactionIndex - 1
					)
					transactionToFocusOnRef.current = transaction.id
				} else if (
					e.key === 'ArrowDown' &&
					transactionIndex !==
						curSortOrderRef.current![transaction.date.val].length - 1
				) {
					e.preventDefault()
					updateTransactionSortOrder(
						transaction.date.val,
						transactionIndex,
						transactionIndex + 1
					)
					transactionToFocusOnRef.current = transaction.id
				}
			}
		},
		[]
	)
	const handleTransactionReorderMousedown = useCallback(
		(transaction: Data.StateTransaction) => (e: MouseEvent) => {
			if (!changesAreDisabled.current) {
				const transactionIndex = curSortOrderRef.current![
					transaction.date.val
				].findIndex((sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === transaction.id
						: sortItem === transaction.id
				)

				const folded = getFoldState(transaction.id)

				return transactionReorderMouseEffect(
					transaction,
					transactionIndex,
					curSortOrderRef.current![transaction.date.val],
					transactionManagerRowsRef,
					folded,
					updateFoldState,
					e,
					(oldIndex, newIndex) => {
						updateTransactionSortOrder(transaction.date.val, oldIndex, newIndex)
						// setTransactionToFocusOn(transaction.id)
						transactionToFocusOnRef.current = transaction.id
					}
				)
			}
		},
		[]
	)
	// applied to each transaction reorder node
	const addToTransactionReorderRefs = useCallback(
		(transaction: Data.StateTransaction) => (node: HTMLButtonElement | null) => {
			if (node !== null) {
				const thisNodeRefIndex = newTransactionReorderRefs.current.findIndex(
					(item) => item.node === node
				)
				if (thisNodeRefIndex !== -1) {
					const thisNodeRef = newTransactionReorderRefs.current[thisNodeRefIndex]
					if (thisNodeRef.transaction_id !== transaction.id) {
						// node already exists, other info needs updated
						node.removeEventListener('keydown', thisNodeRef.keydownListener)
						node.removeEventListener('mousedown', thisNodeRef.mousedownListener)

						const keydownListener = handleTransactionReorderKeydown(transaction)
						const mousedownListener =
							handleTransactionReorderMousedown(transaction)

						node.addEventListener('keydown', keydownListener)
						node.addEventListener('mousedown', mousedownListener)

						thisNodeRef.transaction_id = transaction.id
						thisNodeRef.keydownListener = keydownListener
						thisNodeRef.mousedownListener = mousedownListener
					}
				} else {
					// node not in array yet

					const keydownListener = handleTransactionReorderKeydown(transaction)
					const mousedownListener = handleTransactionReorderMousedown(transaction)

					node.addEventListener('keydown', keydownListener)
					node.addEventListener('mousedown', mousedownListener)

					newTransactionReorderRefs.current.push({
						transaction_id: transaction.id,
						node: node,
						keydownListener,
						mousedownListener,
					})
				}
				if (transactionToFocusOnRef.current === transaction.id) {
					node.focus()
					transactionToFocusOnRef.current = ''
				}
			}
		},
		[]
	)
	/* END TRANSACTION REORDERING LOGIC */

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
		(transaction: Data.StateTransaction, item: Data.StateTransaction['items'][number]) =>
			(e: KeyboardEvent) => {
				if (!changesAreDisabled.current) {
					if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
						const transactionIndex = curSortOrderRef.current![
							transaction.date.val
						].findIndex(
							(sortItem) =>
								Array.isArray(sortItem) && sortItem[0] === transaction.id
						)

						const itemIndex =
							(
								curSortOrderRef.current![transaction.date.val][
									transactionIndex
								] as string[]
							).findIndex((sortItem) => sortItem === item.id) - 1

						if (e.key === 'ArrowUp' && itemIndex !== 0) {
							e.preventDefault()
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
									curSortOrderRef.current![transaction.date.val][
										transactionIndex
									] as string[]
								).length -
									2
						) {
							e.preventDefault()
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
				}
			},
		[]
	)
	const handleItemReorderMousedown = useCallback(
		(
				transaction: Data.StateTransaction,
				item: Data.StateTransaction['items'][number],
				itemRowsRef: MutableRefObject<ItemRowsRef>
			) =>
			(e: MouseEvent) => {
				if (!changesAreDisabled.current) {
					const transactionIndex = curSortOrderRef.current![
						transaction.date.val
					].findIndex(
						(sortItem) =>
							Array.isArray(sortItem) && sortItem[0] === transaction.id
					)

					const itemIndex = (
						curSortOrderRef.current![transaction.date.val][
							transactionIndex
						] as string[]
					).findIndex((sortItem) => sortItem === item.id)

					return itemReorderMouseEffect(
						item,
						itemRowsRef,
						itemIndex - 1,
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
				}
			},
		[]
	)
	// applied to each item reorder node
	const addToItemReorderRefs = useCallback(
		(
				transaction: Data.StateTransaction,
				item: Data.StateTransaction['items'][number],
				itemRowsRef: MutableRefObject<ItemRowsRef>
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
			transaction: Data.StateTransaction,
			transactionIndex: number,
			oldItemIndex: number,
			newItemIndex: number
		) => {
			setCurSortOrder((prev) => {
				const clone = structuredClone(prev)

				const thisTransactionOrder = clone[transaction.date.val][
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

	const addNewItem = (
		transaction_id: string,
		date: string,
		item_id: string,
		itemInsertIndex: number,
		/**
		 * Required if adding an item to a single transaction
		 */
		first_item_id?: string
	) => {
		setCurSortOrder((prev) => {
			const clone = structuredClone(prev)

			const transactionIndex = clone[date].findIndex((sortItem) =>
				Array.isArray(sortItem)
					? sortItem[0] === transaction_id
					: sortItem === transaction_id
			)

			if (Array.isArray(clone[date][transactionIndex])) {
				clone[date][transactionIndex].splice(itemInsertIndex, 0, item_id)
			} else {
				clone[date][transactionIndex] = [
					clone[date][transactionIndex],
					first_item_id!,
					item_id,
				]
			}

			return clone
		})
	}
	const removeNewItem = (transaction_id: string, date: string, item_id: string) => {
		setCurSortOrder((prev) => {
			const clone = structuredClone(prev)
			const transactionIndex = clone[date].findIndex((sortItem) =>
				Array.isArray(sortItem)
					? sortItem[0] === transaction_id
					: sortItem === transaction_id
			)
			const itemIndex = (clone[date][transactionIndex] as string[]).findIndex(
				(id) => id === item_id
			)
			;(clone[date][transactionIndex] as string[]).splice(itemIndex, 1)
			return clone
		})
	}

	// const addNewTransaction = (
	// 	transaction_id: string,
	// 	date: string,
	// 	transactionIndex: number
	// ) => {
	// 	// not yet available
	// }
	// const removeNewTransaction = (transaction_id: string, date: string) => {
	// 	// not yet available
	// }

	return {
		setDefault: setDefSortOrder,
		setCurrent: setCurSortOrder,
		cur: curSortOrder,
		def: defSortOrder,
		addToTransactionReorderRefs,
		addToItemReorderRefs,
		disableChanges: () => {
			changesAreDisabled.current = true
		},
		enableChanges: () => {
			changesAreDisabled.current = false
		},
		genDefaultSortOrder,
		addNewItem,
		removeNewItem,
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
			transaction: Data.StateTransaction
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
			transaction: Data.StateTransaction,
			item: Data.StateTransaction['items'][number],
			itemRowsRef: MutableRefObject<ItemRowsRef>
		) => ItemReorderRefAdder
		disableChanges: () => void
		enableChanges: () => void
		genDefaultSortOrder: (transactions: Data.StateTransaction[]) => void
		addNewItem: (
			transaction_id: string,
			date: string,
			item_id: string,
			itemInsertIndex: number,
			first_item_id?: string
		) => void
		removeNewItem: (transaction_id: string, date: string, item_id: string) => void
	}

	/**
	 * Apply to the `ref` attribute of the buttons used to control Transaction sort order position.
	 */
	export type TransactionReorderRefAdder = (node: HTMLButtonElement | null) => void

	/**
	 * Apply to the `ref` attribute of the buttons used to control Item sort order position.
	 */
	export type ItemReorderRefAdder = (node: HTMLButtonElement | null) => void
}
