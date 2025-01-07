import {
	MutableRefObject,
	Dispatch,
	SetStateAction,
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react'
import { areDeeplyEqual, moveItemInArray } from '@/utils'
import { Data, SortOrder } from '.'

export interface UseHistoryProps {
	data: Data.Controller
	sortOrder: SortOrder.Controller
}

export function useHistory({ data, sortOrder }: UseHistoryProps) {
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

						data.update(
							'transaction',
							historyItem.transaction_id,
							historyItem.key,
							historyItem.oldVal
						)

						node.value = historyItem.oldVal
						node.focus()

						break
					}
					case 'item_value_change': {
						const query = `[data-transaction_id="${historyItem.transaction_id}"][data-key="${historyItem.key}"][data-item_id="${historyItem.item_id}"]`
						const node = document.querySelector(query) as HTMLInputElement

						data.update(
							'item',
							historyItem.item_id,
							historyItem.transaction_id,
							historyItem.key,
							historyItem.oldVal
						)

						node.value = historyItem.oldVal
						node.focus()

						break
					}
					case 'item_deletion': {
						data.unstageDelete(
							'item',
							historyItem.item_id,
							historyItem.transaction_id,
							true
						)
						break
					}
					case 'transaction_deletion': {
						data.unstageDelete('transaction', historyItem.transaction_id, true)
						break
					}
					case 'item_deletion_reversed': {
						data.stageDelete(
							'item',
							historyItem.item_id,
							historyItem.transaction_id,
							true
						)
						break
					}
					case 'transaction_deletion_reversed': {
						data.stageDelete('transaction', historyItem.transaction_id, true)
						break
					}
					case 'item_creation': {
						data.stageDelete(
							'item',
							historyItem.item_id,
							historyItem.transaction_id,
							true
						)
					}
				}
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

						data.update(
							'transaction',
							historyItem.transaction_id,
							historyItem.key,
							historyItem.newVal
						)
						node.value = historyItem.newVal
						node.focus()

						break
					}
					case 'item_value_change': {
						const query = `[data-transaction_id="${historyItem.transaction_id}"][data-key="${historyItem.key}"][data-item_id="${historyItem.item_id}"]`
						const node = document.querySelector(query) as HTMLInputElement

						data.update(
							'item',
							historyItem.item_id,
							historyItem.transaction_id,
							historyItem.key,
							historyItem.newVal
						)

						node.value = historyItem.newVal
						node.focus()

						break
					}
					case 'item_deletion': {
						data.stageDelete(
							'item',
							historyItem.item_id,
							historyItem.transaction_id,
							true
						)
						break
					}
					case 'transaction_deletion': {
						data.stageDelete('transaction', historyItem.transaction_id, true)
						break
					}
					case 'item_deletion_reversed':
						{
							data.unstageDelete(
								'item',
								historyItem.item_id,
								historyItem.transaction_id,
								true
							)
						}
						break
					case 'transaction_deletion_reversed': {
						data.unstageDelete('transaction', historyItem.transaction_id, true)
						break
					}
				}
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
			transaction_id: string
			item_id: string
	  }
	| {
			type: 'transaction_deletion'
			transaction_id: string
	  }
	| {
			type: 'item_deletion_reversed'
			transaction_id: string
			item_id: string
	  }
	| {
			type: 'transaction_deletion_reversed'
			transaction_id: string
	  }
	| {
			type: 'item_creation'
			transaction_id: string
			item_id: string
	  }
	| {
			type: 'transaction_creation'
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
