import {
	MutableRefObject,
	Dispatch,
	SetStateAction,
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react'
import { FormTransaction } from '../TransactionManager'
import { areDeeplyEqual, moveItemInArray } from '@/utils'
import { PendingChanges } from './usePendingChanges'
import { SortOrder } from './'

export interface UseHistoryProps {
	transactionDataRef: MutableRefObject<FormTransaction[] | null>
	setCurSortOrder: Dispatch<SetStateAction<SortOrder.State>>
	updatePendingChanges: PendingChanges.Updater
}

export function useHistory({
	transactionDataRef,
	setCurSortOrder,
	updatePendingChanges,
}: UseHistoryProps) {
	// const [historyStack, setHistoryStack] = useState<HistoryState>({
	// 	undoStack: [],
	// 	redoStack: [],
	// })
	// const historyStackRef = useRef<HistoryState>(historyStack)
	// useEffect(() => {
	// 	historyStackRef.current = historyStack
	// }, [historyStack])
	const historyStackRef = useRef<HistoryState>({ undoStack: [], redoStack: [] })

	const undo = useCallback(() => {
		if (historyStackRef.current.undoStack.length !== 0) {
			const item = historyStackRef.current.undoStack.at(-1)
			if (item !== undefined) {
				switch (item.type) {
					case 'transaction_position_change': {
						setCurSortOrder((prev) => {
							const clone = structuredClone(prev)
							moveItemInArray(clone[item.date], item.newIndex, item.oldIndex)
							return clone
						})
						break
					}
					case 'item_position_change': {
						setCurSortOrder((prev) => {
							const clone = structuredClone(prev)
							const thisSortIndex = clone[item.date].findIndex((sortItem) => {
								return (
									Array.isArray(sortItem) &&
									sortItem[0] === item.transaction_id
								)
							})
							const thisSortArray = clone[item.date][thisSortIndex] as string[]

							moveItemInArray(
								thisSortArray,
								item.newIndex + 1,
								item.oldIndex + 1
							)
							return clone
						})
						break
					}
					case 'transaction_value_change': {
						const query = `[data-transaction_id="${item.transaction_id}"][data-key="${item.key}"]:not([data-item_id])`
						const node = document.querySelector(query) as HTMLInputElement

						let defaultValue = transactionDataRef.current!.find(
							(transaction) => transaction.id === item.transaction_id
						)![item.key]

						if (defaultValue !== item.oldVal) {
							updatePendingChanges(
								'transactions',
								item.transaction_id,
								item.key,
								item.oldVal
							)
						} else {
							updatePendingChanges(
								'transactions',
								item.transaction_id,
								item.key
							)
						}
						node.value = item.oldVal
						node.focus()

						break
					}
					case 'item_value_change': {
						const query = `[data-transaction_id="${item.transaction_id}"][data-key="${item.key}"][data-item_id="${item.item_id}"]`
						const node = document.querySelector(query) as HTMLInputElement

						let defaultValue = transactionDataRef
							.current!.find(
								(transaction) => transaction.id === item.transaction_id
							)!
							.items.find((it) => it.id === item.item_id)![item.key]

						if (defaultValue !== item.oldVal) {
							updatePendingChanges(
								'items',
								item.item_id,
								item.key,
								item.oldVal
							)
						} else {
							updatePendingChanges('items', item.item_id, item.key)
						}

						node.value = item.oldVal
						node.focus()

						break
					}
				}
				// setHistoryStack((prev) => {
				// 	const clone = structuredClone(prev)
				// 	const thisItem = clone.undoStack.pop()!
				// 	clone.redoStack.unshift(thisItem)
				// 	return clone
				// })
				const thisItem = historyStackRef.current.undoStack.pop()!
				historyStackRef.current.redoStack.unshift(thisItem)
			}
		}
	}, [])
	const redo = useCallback(() => {
		if (historyStackRef.current.redoStack.length !== 0) {
			const item = historyStackRef.current.redoStack[0]
			if (item !== undefined) {
				switch (item.type) {
					case 'transaction_position_change': {
						setCurSortOrder((prev) => {
							const clone = structuredClone(prev)
							moveItemInArray(clone[item.date], item.oldIndex, item.newIndex)
							return clone
						})
						break
					}
					case 'item_position_change': {
						setCurSortOrder((prev) => {
							const clone = structuredClone(prev)
							const thisSortIndex = clone[item.date].findIndex((sortItem) => {
								return (
									Array.isArray(sortItem) &&
									sortItem[0] === item.transaction_id
								)
							})
							const thisSortArray = clone[item.date][thisSortIndex] as string[]
							moveItemInArray(
								thisSortArray,
								item.oldIndex + 1,
								item.newIndex + 1
							)
							return clone
						})
						break
					}
					case 'transaction_value_change': {
						const query = `[data-transaction_id="${item.transaction_id}"][data-key="${item.key}"]:not([data-item_id])`
						const node = document.querySelector(query) as HTMLInputElement

						// update pendingChanges
						let defaultValue: string | null = null
						if (transactionDataRef.current! !== null) {
							defaultValue = transactionDataRef.current!.find(
								(transaction) => transaction.id === item.transaction_id
							)![item.key]
						}

						if (defaultValue !== item.newVal) {
							updatePendingChanges(
								'transactions',
								item.transaction_id,
								item.key,
								item.newVal
							)
						} else {
							updatePendingChanges(
								'transactions',
								item.transaction_id,
								item.key
							)
						}
						node.value = item.newVal
						node.focus()

						break
					}
					case 'item_value_change': {
						const query = `[data-transaction_id="${item.transaction_id}"][data-key="${item.key}"][data-item_id="${item.item_id}"]`
						const node = document.querySelector(query) as HTMLInputElement

						let defaultValue = transactionDataRef
							.current!.find(
								(transaction) => transaction.id === item.transaction_id
							)!
							.items.find((it) => it.id === item.item_id)![item.key]

						if (defaultValue !== item.newVal) {
							updatePendingChanges(
								'items',
								item.item_id,
								item.key,
								item.newVal
							)
						} else {
							updatePendingChanges('items', item.item_id, item.key)
						}

						node.value = item.newVal
						node.focus()

						break
					}
				}
				// setHistoryStack((prev) => {
				// 	const clone = structuredClone(prev)
				// 	const thisItem = clone.redoStack.shift()!
				// 	clone.undoStack.push(thisItem)
				// 	return clone
				// })
				const thisItem = historyStackRef.current.redoStack.shift()!
				historyStackRef.current.undoStack.push(thisItem)
			}
		}
	}, [])

	const add = useCallback((item: HistoryItem) => {
		// setHistoryStack((prev) => {
		// 	const clone = structuredClone(prev)
		// 	clone.undoStack.push(item)
		// 	return clone
		// })
		historyStackRef.current.undoStack.push(item)
	}, [])

	const clearUndo = useCallback(() => {
		if (historyStackRef.current.undoStack.length > 0) {
			// setHistoryStack((prev) => {
			// 	const clone = structuredClone(prev)
			// 	clone.undoStack = []
			// 	return clone
			// })
			historyStackRef.current.undoStack = []
		}
	}, [])

	const clear = useCallback(() => {
		// setHistoryStack({ undoStack: [], redoStack: [] })

		historyStackRef.current.undoStack = []
		historyStackRef.current.redoStack = []
	}, [])

	const clearRedo = useCallback(() => {
		if (historyStackRef.current.redoStack.length > 0) {
			// setHistoryStack((prev) => {
			// 	const clone = structuredClone(prev)
			// 	clone.redoStack = []
			// 	return clone
			// })
			historyStackRef.current.redoStack = []
		}
	}, [])

	const upsert = useCallback((item: HistoryItem) => {
		// setHistoryStack((prev) => {
		// 	const clone = structuredClone(prev)
		// 	const recentItem = clone.undoStack.at(-1)

		// 	if (
		// 		recentItem !== undefined &&
		// 		item.type !== 'item_position_change' &&
		// 		item.type !== 'transaction_position_change' &&
		// 		recentItem.type !== 'item_position_change' &&
		// 		recentItem.type !== 'transaction_position_change'
		// 	) {
		// 		let recentItemCopy = structuredClone(recentItem) as any
		// 		let thisItemCopy = structuredClone(item) as any

		// 		delete recentItemCopy.oldVal
		// 		delete recentItemCopy.newVal
		// 		delete thisItemCopy.oldVal
		// 		delete thisItemCopy.newVal

		// 		if (areDeeplyEqual(recentItemCopy, thisItemCopy)) {
		// 			recentItem.newVal = item.newVal
		// 			return clone
		// 		}
		// 	}
		// 	clone.undoStack.push(item)
		// 	clone.redoStack = []
		// 	return clone
		// })

		const recentItem = historyStackRef.current.undoStack.at(-1)

		if (
			recentItem !== undefined &&
			item.type !== 'item_position_change' &&
			item.type !== 'transaction_position_change' &&
			recentItem.type !== 'item_position_change' &&
			recentItem.type !== 'transaction_position_change'
		) {
			let recentItemCopy = structuredClone(recentItem) as any
			let thisItemCopy = structuredClone(item) as any

			delete recentItemCopy.oldVal
			delete recentItemCopy.newVal
			delete thisItemCopy.oldVal
			delete thisItemCopy.newVal

			if (areDeeplyEqual(recentItemCopy, thisItemCopy)) {
				recentItem.newVal = item.newVal
				return
			}
		}
		historyStackRef.current.undoStack.push(item)
		historyStackRef.current.redoStack = []
	}, [])

	const undoDisabled = () => historyStackRef.current.undoStack.length === 0
	const redoDisabled = () => historyStackRef.current.redoStack.length === 0

	return {
		undo,
		redo,
		add,
		upsert,
		clearUndo,
		clearRedo,
		clear,
		undoDisabled,
		redoDisabled,
	} as HistoryController
}

export type HistoryItem =
	| {
			type: 'transaction_position_change'
			date: string
			oldIndex: number
			newIndex: number
	  }
	| {
			type: 'item_position_change'
			date: string
			transaction_id: string
			oldIndex: number
			newIndex: number
	  }
	| {
			type: 'transaction_value_change'
			transaction_id: string
			key: 'name' | 'date'
			oldVal: string
			newVal: string
	  }
	| {
			type: 'item_value_change'
			transaction_id: string
			item_id: string
			key: 'name' | 'amount' | 'category_id' | 'account_id'
			oldVal: string
			newVal: string
	  }

export type HistoryState = { undoStack: HistoryItem[]; redoStack: HistoryItem[] }

/**
 * Contains methods used to manipulate `HistoryState`
 */
export type HistoryController = {
	/**
	 * Undoes the most recent change, and adds it to the `redo` array.
	 */
	undo: () => void
	/**
	 * Redos the most recent change, and adds it to the `undo` array.
	 */
	redo: () => void
	/**
	 * Adds a new item to the `undo` array, and clears the `redo` array.
	 */
	add: (item: HistoryItem) => void
	/**
	 * Adds a new item to the `undo` array, or updates the most recent item in the `undo` array if all properties are the same (besides newVal).
	 */
	upsert: (item: HistoryItem) => void
	/**
	 * clears the `undo` array
	 */
	clearUndo: () => void
	/**
	 * clears the `redo` array
	 */
	clearRedo: () => void
	/**
	 * clears the `undo` and `redo` array
	 */
	clear: () => void
	/**
	 * returns `true` if the `undo` array is empty, otherwise `false`
	 */
	undoDisabled: () => boolean
	/**
	 * returns `true` if the `redo` array is empty, otherwise `false`
	 */
	redoDisabled: () => boolean
}
