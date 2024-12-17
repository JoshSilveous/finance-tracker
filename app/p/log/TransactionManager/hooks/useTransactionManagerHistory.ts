import {
	MutableRefObject,
	Dispatch,
	SetStateAction,
	useState,
	useMemo,
	useEffect,
	useRef,
} from 'react'
import { FormTransaction, SortOrder, PendingChangeUpdater } from '../TransactionManager'
import { moveItemInArray } from '@/utils'

export function useTransactionManagerHistory(
	transactionDataRef: MutableRefObject<FormTransaction[] | null>,
	setCurSortOrder: Dispatch<SetStateAction<SortOrder>>,
	updatePendingChanges: PendingChangeUpdater
) {
	const [historyStack, setHistoryStack] = useState<HistoryState>({
		undoStack: [],
		redoStack: [],
	})
	const historyStackRef = useRef<HistoryState>(historyStack)

	useEffect(() => {
		historyStackRef.current = historyStack
	}, [historyStack])

	const historyController = useMemo(
		() => ({
			undo: () => {
				const item = historyStackRef.current!.undoStack.at(-1)
				if (item !== undefined) {
					switch (item.type) {
						case 'transaction_position_change': {
							setCurSortOrder((prev) => {
								const clone = structuredClone(prev)
								moveItemInArray(
									clone[item.date],
									item.newIndex,
									item.oldIndex
								)
								return clone
							})
							break
						}
						case 'item_position_change': {
							setCurSortOrder((prev) => {
								const clone = structuredClone(prev)
								const thisSortIndex = clone[item.date].findIndex(
									(sortItem) => {
										return (
											Array.isArray(sortItem) &&
											sortItem[0] === item.transaction_id
										)
									}
								)
								const thisSortArray = clone[item.date][
									thisSortIndex
								] as string[]

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
					setHistoryStack((prev) => {
						const clone = structuredClone(prev)
						const thisItem = clone.undoStack.pop()!
						clone.redoStack.unshift(thisItem)
						return clone
					})
				}
			},
			redo: () => {
				const item = historyStackRef.current!.redoStack[0]
				if (item !== undefined) {
					switch (item.type) {
						case 'transaction_position_change': {
							setCurSortOrder((prev) => {
								const clone = structuredClone(prev)
								moveItemInArray(
									clone[item.date],
									item.oldIndex,
									item.newIndex
								)
								return clone
							})
							break
						}
						case 'item_position_change': {
							setCurSortOrder((prev) => {
								const clone = structuredClone(prev)
								const thisSortIndex = clone[item.date].findIndex(
									(sortItem) => {
										return (
											Array.isArray(sortItem) &&
											sortItem[0] === item.transaction_id
										)
									}
								)
								const thisSortArray = clone[item.date][
									thisSortIndex
								] as string[]
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
					setHistoryStack((prev) => {
						const clone = structuredClone(prev)
						const thisItem = clone.redoStack.shift()!
						clone.undoStack.push(thisItem)
						return clone
					})
				}
			},
			add: (item: HistoryItem) => {
				setHistoryStack((prev) => {
					const clone = structuredClone(prev)
					clone.undoStack.push(item)
					clone.redoStack = [] // clear redo stack whenever a new item is added
					return clone
				})
			},
		}),
		[]
	)

	return historyController as HistoryController
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
	add: (item: HistoryItem) => {}
}
