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
import { PendingChangeController } from './usePendingChanges'
import { SortOrder } from './'

export interface UseHistoryProps {
	transactionDataRef: MutableRefObject<FormTransaction[] | null>
	sortOrder: SortOrder.Controller
	pendingChanges: PendingChangeController
}

export function useHistory({
	transactionDataRef,
	sortOrder,
	pendingChanges,
}: UseHistoryProps) {
	const historyStackRef = useRef<HistoryState>({ undoStack: [], redoStack: [] })

	const undo = useCallback(() => {
		if (historyStackRef.current.undoStack.length !== 0) {
			const historyItem = historyStackRef.current.undoStack.at(-1)
			if (historyItem !== undefined) {
				switch (historyItem.type) {
					case 'transaction_position_change': {
						sortOrder.setCurrent((prev) => {
							const clone = structuredClone(prev)
							moveItemInArray(
								clone[historyItem.date],
								historyItem.newIndex,
								historyItem.oldIndex
							)
							return clone
						})
						break
					}
					case 'item_position_change': {
						sortOrder.setCurrent((prev) => {
							const clone = structuredClone(prev)
							const thisSortIndex = clone[historyItem.date].findIndex(
								(sortItem) => {
									return (
										Array.isArray(sortItem) &&
										sortItem[0] === historyItem.transaction_id
									)
								}
							)
							const thisSortArray = clone[historyItem.date][
								thisSortIndex
							] as string[]

							moveItemInArray(
								thisSortArray,
								historyItem.newIndex + 1,
								historyItem.oldIndex + 1
							)
							return clone
						})
						break
					}
					case 'transaction_value_change': {
						const query = `[data-transaction_id="${historyItem.transaction_id}"][data-key="${historyItem.key}"]:not([data-item_id])`
						const node = document.querySelector(query) as HTMLInputElement

						let defaultValue = transactionDataRef.current!.find(
							(transaction) => transaction.id === historyItem.transaction_id
						)![historyItem.key]

						if (defaultValue !== historyItem.oldVal) {
							pendingChanges.changes.set(
								'transactions',
								historyItem.transaction_id,
								historyItem.key,
								historyItem.oldVal
							)
						} else {
							pendingChanges.changes.set(
								'transactions',
								historyItem.transaction_id,
								historyItem.key
							)
						}
						node.value = historyItem.oldVal
						node.focus()

						break
					}
					case 'item_value_change': {
						const query = `[data-transaction_id="${historyItem.transaction_id}"][data-key="${historyItem.key}"][data-item_id="${historyItem.item_id}"]`
						const node = document.querySelector(query) as HTMLInputElement

						let defaultValue = transactionDataRef
							.current!.find(
								(transaction) =>
									transaction.id === historyItem.transaction_id
							)!
							.items.find((it) => it.id === historyItem.item_id)![
							historyItem.key
						]

						if (defaultValue !== historyItem.oldVal) {
							pendingChanges.changes.set(
								'items',
								historyItem.item_id,
								historyItem.key,
								historyItem.oldVal
							)
						} else {
							pendingChanges.changes.set(
								'items',
								historyItem.item_id,
								historyItem.key
							)
						}

						node.value = historyItem.oldVal
						node.focus()

						break
					}
					case 'item_deletion': {
						pendingChanges.deletions.remove('item', historyItem.item_id, true)
						break
					}
					case 'transaction_deletion': {
						// figuring out undo/redo for deletions
						pendingChanges.deletions.remove(
							'transaction',
							historyItem.transaction_id,
							true
						)
						break
					}
					case 'item_deletion_reversed': {
						pendingChanges.deletions.add('item', historyItem.item_id, true)
						break
					}
					case 'transaction_deletion_reversed': {
						pendingChanges.deletions.add(
							'transaction',
							historyItem.transaction_id,
							true
						)
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
			const historyItem = historyStackRef.current.redoStack[0]
			if (historyItem !== undefined) {
				switch (historyItem.type) {
					case 'transaction_position_change': {
						sortOrder.setCurrent((prev) => {
							const clone = structuredClone(prev)
							moveItemInArray(
								clone[historyItem.date],
								historyItem.oldIndex,
								historyItem.newIndex
							)
							return clone
						})
						break
					}
					case 'item_position_change': {
						sortOrder.setCurrent((prev) => {
							const clone = structuredClone(prev)
							const thisSortIndex = clone[historyItem.date].findIndex(
								(sortItem) => {
									return (
										Array.isArray(sortItem) &&
										sortItem[0] === historyItem.transaction_id
									)
								}
							)
							const thisSortArray = clone[historyItem.date][
								thisSortIndex
							] as string[]
							moveItemInArray(
								thisSortArray,
								historyItem.oldIndex + 1,
								historyItem.newIndex + 1
							)
							return clone
						})
						break
					}
					case 'transaction_value_change': {
						const query = `[data-transaction_id="${historyItem.transaction_id}"][data-key="${historyItem.key}"]:not([data-item_id])`
						const node = document.querySelector(query) as HTMLInputElement

						// update pendingChanges
						let defaultValue: string | null = null
						if (transactionDataRef.current! !== null) {
							defaultValue = transactionDataRef.current!.find(
								(transaction) =>
									transaction.id === historyItem.transaction_id
							)![historyItem.key]
						}

						if (defaultValue !== historyItem.newVal) {
							pendingChanges.changes.set(
								'transactions',
								historyItem.transaction_id,
								historyItem.key,
								historyItem.newVal
							)
						} else {
							pendingChanges.changes.set(
								'transactions',
								historyItem.transaction_id,
								historyItem.key
							)
						}
						node.value = historyItem.newVal
						node.focus()

						break
					}
					case 'item_value_change': {
						const query = `[data-transaction_id="${historyItem.transaction_id}"][data-key="${historyItem.key}"][data-item_id="${historyItem.item_id}"]`
						const node = document.querySelector(query) as HTMLInputElement

						let defaultValue = transactionDataRef
							.current!.find(
								(transaction) =>
									transaction.id === historyItem.transaction_id
							)!
							.items.find((it) => it.id === historyItem.item_id)![
							historyItem.key
						]

						if (defaultValue !== historyItem.newVal) {
							pendingChanges.changes.set(
								'items',
								historyItem.item_id,
								historyItem.key,
								historyItem.newVal
							)
						} else {
							pendingChanges.changes.set(
								'items',
								historyItem.item_id,
								historyItem.key
							)
						}

						node.value = historyItem.newVal
						node.focus()

						break
					}
					case 'item_deletion': {
						pendingChanges.deletions.add('item', historyItem.item_id)
						break
					}
					case 'transaction_deletion': {
						pendingChanges.deletions.add(
							'transaction',
							historyItem.transaction_id
						)
						break
					}
					case 'item_deletion_reversed': {
						pendingChanges.deletions.remove('item', historyItem.item_id)
						break
					}
					case 'transaction_deletion_reversed': {
						pendingChanges.deletions.remove(
							'transaction',
							historyItem.transaction_id
						)
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

	const add = (item: HistoryItem) => {
		historyStackRef.current.undoStack.push(item)
	}

	const clearUndo = () => {
		if (historyStackRef.current.undoStack.length > 0) {
			historyStackRef.current.undoStack = []
		}
	}

	const clear = () => {
		historyStackRef.current.undoStack = []
		historyStackRef.current.redoStack = []
	}

	const clearRedo = () => {
		if (historyStackRef.current.redoStack.length > 0) {
			historyStackRef.current.redoStack = []
		}
	}

	const upsert = (item: HistoryItem) => {
		const recentItem = historyStackRef.current.undoStack.at(-1)

		if (
			recentItem !== undefined &&
			(item.type === 'item_value_change' ||
				item.type === 'transaction_value_change') &&
			(recentItem.type === 'item_value_change' ||
				recentItem.type === 'transaction_value_change')
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
	}

	const undoDisabled = historyStackRef.current.undoStack.length === 0
	const redoDisabled = historyStackRef.current.redoStack.length === 0

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
	| {
			type: 'item_deletion'
			item_id: string
	  }
	| {
			type: 'transaction_deletion'
			transaction_id: string
	  }
	| {
			type: 'item_deletion_reversed'
			item_id: string
	  }
	| {
			type: 'transaction_deletion_reversed'
			transaction_id: string
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
	 * `true` if the `undo` array is empty, otherwise `false`
	 */
	undoDisabled: boolean
	/**
	 * `true` if the `redo` array is empty, otherwise `false`
	 */
	redoDisabled: boolean
}
