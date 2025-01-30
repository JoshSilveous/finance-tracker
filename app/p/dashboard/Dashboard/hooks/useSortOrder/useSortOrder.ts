import { moveItemInArray } from '@/utils'
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { Data } from '../../../Dashboard/hooks/useData/useData'
import { DashboardController } from '../useDashboardController'

export function useSortOrder(getDashboardController: () => DashboardController) {
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
			if (sortOrder[transaction.date.orig] === undefined) {
				sortOrder[transaction.date.orig] = [
					[transaction.id, ...transaction.items.map((item) => item.id)],
				]
			} else {
				sortOrder[transaction.date.orig] = [
					...sortOrder[transaction.date.orig],
					[transaction.id, ...transaction.items.map((item) => item.id)],
				]
			}
		})

		// flip transactions sort order (so new transactions appear at the top)
		Object.entries(sortOrder).forEach(([date, sortItems]) => {
			sortOrder[date] = sortItems.reverse()
		})
		setDefSortOrder(sortOrder)
		setCurSortOrder(sortOrder)
	}

	// /* TRANSACTION REORDERING LOGIC */

	// // used to re-gain focus on the reorder node after re-renders
	// const transactionToFocusOnRef = useRef<string>('')

	// // holds references to all of the transaction reorder buttons
	// const newTransactionReorderRefs = useRef<
	// 	{
	// 		transaction_id: string
	// 		node: HTMLButtonElement
	// 		keydownListener: (e: KeyboardEvent) => void
	// 		mousedownListener: (e: MouseEvent) => void
	// 	}[]
	// >([])
	// const handleTransactionReorderKeydown = useCallback(
	// 	(transaction: Data.StateTransaction) => (e: KeyboardEvent) => {
	// 		if (!changesAreDisabled.current) {
	// 			const transactionIndex = curSortOrderRef.current![
	// 				transaction.date.orig
	// 			].findIndex((sortItem) =>
	// 				Array.isArray(sortItem)
	// 					? sortItem[0] === transaction.id
	// 					: sortItem === transaction.id
	// 			)

	// 			if (e.key === 'ArrowUp' && transactionIndex !== 0) {
	// 				e.preventDefault()
	// 				updateTransactionSortOrder(
	// 					transaction.date.orig,
	// 					transactionIndex,
	// 					transactionIndex - 1
	// 				)
	// 				transactionToFocusOnRef.current = transaction.id
	// 			} else if (
	// 				e.key === 'ArrowDown' &&
	// 				transactionIndex !==
	// 					curSortOrderRef.current![transaction.date.orig].length - 1
	// 			) {
	// 				e.preventDefault()
	// 				updateTransactionSortOrder(
	// 					transaction.date.orig,
	// 					transactionIndex,
	// 					transactionIndex + 1
	// 				)
	// 				transactionToFocusOnRef.current = transaction.id
	// 			}
	// 		}
	// 	},
	// 	[]
	// )
	// const handleTransactionReorderMousedown = useCallback(
	// 	(transaction: Data.StateTransaction) => (e: MouseEvent) => {
	// 		if (!changesAreDisabled.current) {
	// 			const transactionIndex = curSortOrderRef.current![
	// 				transaction.date.orig
	// 			].findIndex((sortItem) =>
	// 				Array.isArray(sortItem)
	// 					? sortItem[0] === transaction.id
	// 					: sortItem === transaction.id
	// 			)

	// 			const folded = getFoldState(transaction.id)

	// 			return transactionReorderMouseEffect(
	// 				transaction,
	// 				transactionIndex,
	// 				curSortOrderRef.current![transaction.date.orig],
	// 				transactionManagerRowsRef,
	// 				folded,
	// 				updateFoldState,
	// 				e,
	// 				(oldIndex, newIndex) => {
	// 					updateTransactionSortOrder(transaction.date.orig, oldIndex, newIndex)
	// 					// setTransactionToFocusOn(transaction.id)
	// 					transactionToFocusOnRef.current = transaction.id
	// 				}
	// 			)
	// 		}
	// 	},
	// 	[]
	// )
	// // applied to each transaction reorder node
	// const addToTransactionReorderRefs = useCallback(
	// 	(transaction: Data.StateTransaction) => (node: HTMLButtonElement | null) => {
	// 		if (node !== null) {
	// 			const thisNodeRefIndex = newTransactionReorderRefs.current.findIndex(
	// 				(item) => item.node === node
	// 			)
	// 			if (thisNodeRefIndex !== -1) {
	// 				const thisNodeRef = newTransactionReorderRefs.current[thisNodeRefIndex]
	// 				if (thisNodeRef.transaction_id !== transaction.id) {
	// 					// node already exists, other info needs updated
	// 					node.removeEventListener('keydown', thisNodeRef.keydownListener)
	// 					node.removeEventListener('mousedown', thisNodeRef.mousedownListener)

	// 					const keydownListener = handleTransactionReorderKeydown(transaction)
	// 					const mousedownListener =
	// 						handleTransactionReorderMousedown(transaction)

	// 					node.addEventListener('keydown', keydownListener)
	// 					node.addEventListener('mousedown', mousedownListener)

	// 					thisNodeRef.transaction_id = transaction.id
	// 					thisNodeRef.keydownListener = keydownListener
	// 					thisNodeRef.mousedownListener = mousedownListener
	// 				}
	// 			} else {
	// 				// node not in array yet

	// 				const keydownListener = handleTransactionReorderKeydown(transaction)
	// 				const mousedownListener = handleTransactionReorderMousedown(transaction)

	// 				node.addEventListener('keydown', keydownListener)
	// 				node.addEventListener('mousedown', mousedownListener)

	// 				newTransactionReorderRefs.current.push({
	// 					transaction_id: transaction.id,
	// 					node: node,
	// 					keydownListener,
	// 					mousedownListener,
	// 				})
	// 			}
	// 			if (transactionToFocusOnRef.current === transaction.id) {
	// 				node.focus()
	// 				transactionToFocusOnRef.current = ''
	// 			}
	// 		}
	// 	},
	// 	[]
	// )
	// /* END TRANSACTION REORDERING LOGIC */

	// /* ITEM REORDERING LOGIC */

	// // used to re-gain focus on the reorder node after re-renders
	// const [itemToFocusOn, setItemToFocusOn] = useState<{
	// 	transaction_id: string
	// 	item_id: string
	// } | null>(null)
	// useEffect(() => {
	// 	if (itemToFocusOn !== null) {
	// 		const { transaction_id, item_id } = itemToFocusOn
	// 		itemReorderRefs.current[transaction_id][item_id].focus()
	// 		setItemToFocusOn(null)
	// 	}
	// }, [itemToFocusOn])

	// // holds references to all of the item reorder buttons
	// const itemReorderRefs = useRef<{
	// 	[transaction_id: string]: { [item_id: string]: HTMLElement }
	// }>({})
	// const handleItemReorderKeydown = useCallback(
	// 	(transaction: Data.StateTransaction, item: Data.StateTransaction['items'][number]) =>
	// 		(e: KeyboardEvent) => {
	// 			if (!changesAreDisabled.current) {
	// 				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
	// 					const transactionIndex = curSortOrderRef.current![
	// 						transaction.date.orig
	// 					].findIndex(
	// 						(sortItem) =>
	// 							Array.isArray(sortItem) && sortItem[0] === transaction.id
	// 					)

	// 					const itemIndex =
	// 						(
	// 							curSortOrderRef.current![transaction.date.orig][
	// 								transactionIndex
	// 							] as string[]
	// 						).findIndex((sortItem) => sortItem === item.id) - 1

	// 					if (e.key === 'ArrowUp' && itemIndex !== 0) {
	// 						e.preventDefault()
	// 						updateItemSortOrder(
	// 							transaction,
	// 							transactionIndex,
	// 							itemIndex,
	// 							itemIndex - 1
	// 						)
	// 						setItemToFocusOn({
	// 							transaction_id: transaction.id,
	// 							item_id: item.id,
	// 						})
	// 					} else if (
	// 						e.key === 'ArrowDown' &&
	// 						itemIndex !==
	// 							(
	// 								curSortOrderRef.current![transaction.date.orig][
	// 									transactionIndex
	// 								] as string[]
	// 							).length -
	// 								2
	// 					) {
	// 						e.preventDefault()
	// 						updateItemSortOrder(
	// 							transaction,
	// 							transactionIndex,
	// 							itemIndex,
	// 							itemIndex + 1
	// 						)
	// 						setItemToFocusOn({
	// 							transaction_id: transaction.id,
	// 							item_id: item.id,
	// 						})
	// 					}
	// 				}
	// 			}
	// 		},
	// 	[]
	// )
	// const handleItemReorderMousedown = useCallback(
	// 	(
	// 			transaction: Data.StateTransaction,
	// 			item: Data.StateTransaction['items'][number],
	// 			itemRowsRef: MutableRefObject<ItemRowsRef>
	// 		) =>
	// 		(e: MouseEvent) => {
	// 			if (!changesAreDisabled.current) {
	// 				const transactionIndex = curSortOrderRef.current![
	// 					transaction.date.orig
	// 				].findIndex(
	// 					(sortItem) =>
	// 						Array.isArray(sortItem) && sortItem[0] === transaction.id
	// 				)

	// 				const itemIndex = (
	// 					curSortOrderRef.current![transaction.date.orig][
	// 						transactionIndex
	// 					] as string[]
	// 				).findIndex((sortItem) => sortItem === item.id)

	// 				return itemReorderMouseEffect(
	// 					item,
	// 					itemRowsRef,
	// 					itemIndex - 1,
	// 					e,
	// 					(oldIndex, newIndex) => {
	// 						updateItemSortOrder(
	// 							transaction,
	// 							transactionIndex,
	// 							oldIndex,
	// 							newIndex
	// 						)
	// 						setItemToFocusOn({
	// 							transaction_id: transaction.id,
	// 							item_id: item.id,
	// 						})
	// 					}
	// 				)
	// 			}
	// 		},
	// 	[]
	// )
	// // applied to each item reorder node
	// const addToItemReorderRefs = useCallback(
	// 	(
	// 			transaction: Data.StateTransaction,
	// 			item: Data.StateTransaction['items'][number],
	// 			itemRowsRef: MutableRefObject<ItemRowsRef>
	// 		) =>
	// 		(node: HTMLElement | null) => {
	// 			if (node !== null) {
	// 				itemReorderRefs.current[transaction.id] ||= {}

	// 				if (itemReorderRefs.current[transaction.id][item.id] !== node) {
	// 					itemReorderRefs.current[transaction.id][item.id] = node

	// 					node.addEventListener(
	// 						'keydown',
	// 						handleItemReorderKeydown(transaction, item)
	// 					)
	// 					node.addEventListener(
	// 						'mousedown',
	// 						handleItemReorderMousedown(transaction, item, itemRowsRef)
	// 					)
	// 				}
	// 			}
	// 		},
	// 	[]
	// )

	/* END ITEM REORDERING LOGIC */

	const discardChanges = () => {
		setCurSortOrder(defSortOrder)
	}

	const updateItemSortOrder = useCallback(
		(
			transaction: Data.StateTransaction,
			transactionIndex: number,
			oldItemIndex: number,
			newItemIndex: number
		) => {
			setCurSortOrder((prev) => {
				const clone = structuredClone(prev)

				const thisTransactionOrder = clone[transaction.date.orig][
					transactionIndex
				] as string[]

				moveItemInArray(thisTransactionOrder, oldItemIndex + 1, newItemIndex + 1)

				return clone
			})
			getDashboardController().history.add({
				type: 'item_position_change',
				transaction_id: transaction.id,
				date: transaction.date.val,
				oldIndex: oldItemIndex,
				newIndex: newItemIndex,
			})
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
			getDashboardController().history.add({
				type: 'transaction_position_change',
				date: date,
				oldIndex: oldIndex,
				newIndex: newIndex,
			})
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

			const transactionIndex = clone[date].findIndex(
				(sortItem) => sortItem[0] === transaction_id
			)

			clone[date][transactionIndex].splice(itemInsertIndex, 0, item_id)

			return clone
		})
	}
	const removeNewItem = (transaction_id: string, date: string, item_id: string) => {
		setCurSortOrder((prev) => {
			const clone = structuredClone(prev)
			const transactionIndex = clone[date].findIndex(
				(sortItem) => sortItem[0] === transaction_id
			)
			const itemIndex = (clone[date][transactionIndex] as string[]).findIndex(
				(id) => id === item_id
			)
			;(clone[date][transactionIndex] as string[]).splice(itemIndex, 1)
			return clone
		})
	}
	const addNewTransaction = (sortItem: SortOrder.SortItem, date: string) => {
		setCurSortOrder((prev) => {
			const clone = structuredClone(prev)
			if (clone[date] !== undefined) {
				clone[date].unshift(sortItem)
			} else {
				clone[date] = [sortItem]
			}
			return clone
		})
	}

	return {
		setDefault: setDefSortOrder,
		setCurrent: setCurSortOrder,
		cur: curSortOrder,
		def: defSortOrder,
		disableChanges: () => {
			changesAreDisabled.current = true
		},
		enableChanges: () => {
			changesAreDisabled.current = false
		},
		genDefaultSortOrder,
		addNewItem,
		removeNewItem,
		discardChanges,
		addNewTransaction,
	} as SortOrder.Controller
}

export namespace SortOrder {
	/**
	 * An array of strings, with the first string being the `transaction_id` and subsequent strings being the matching transaction's item's `item_id`s, in order of sort.
	 *
	 *
	 * @example
	 * ```ts
	 * const transaction = {
	 * 	id: 'trn_1',
	 * 	...,
	 * 	items: [
	 * 		{id: 'itm_1', ...}, // order in data doesn't reliably reflect sort order
	 * 		{id: 'itm_2', ...},
	 * 		{id: 'itm_3', ...},
	 * 	]
	 * }
	 *
	 *	const sortItem = ['trn_1', 'itm_3', 'itm_1', 'itm_2']
	 *
	 * ```
	 */
	export type SortItem = string[]

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
		[date: string]: SortItem[]
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
		discardChanges: () => void
		addNewTransaction: (sortItem: SortOrder.SortItem, date: string) => void
	}
}
