import { useEffect, useRef, useState } from 'react'
import { fetchAccountData, fetchCategoryData, fetchTransactionData } from '@/database'
import { areDeeplyEqual, getCurDateString } from '@/utils'
import { SortOrder } from '../useSortOrder'
import { HistoryController } from '../useHistory'

export type UseDataOptions = {
	onReload?: (newData: Data.State) => void
	getSortOrderController: () => SortOrder.Controller
	getHistoryController: () => HistoryController
}
export function useData(p: UseDataOptions) {
	const [data, setData] = useState<Data.State>({
		transactions: [],
		categories: [],
		accounts: [],
	})
	const dataRef = useRef(data)
	useEffect(() => {
		dataRef.current = data
	}, [data])
	const origDataRef = useRef<Data.State>({
		transactions: [],
		categories: [],
		accounts: [],
	})
	useEffect(() => {
		origDataRef.current = origDataRef.current
	}, [origDataRef.current])

	const [isLoading, setIsLoading] = useState(false)
	const [isPendingSave, setIsPendingSave] = useState(false)

	useEffect(() => {
		if (isPendingSave && areDeeplyEqual(data, origDataRef.current)) {
			setIsPendingSave(false)
		} else if (!isPendingSave && !areDeeplyEqual(data, origDataRef.current)) {
			setIsPendingSave(true)
		}
	}, [data])

	const update: Data.Update = (type, ...args) => {
		if (type === 'transaction') {
			const [transaction_id, key, value] = args as Data.UpdateTransactionArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					console.error(
						`Transaction "${transaction_id}" cannot be found in data.`,
						'\ndata.transactions:',
						structuredClone(data.transactions)
					)
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = clone.transactions[transactionIndex]
				if (transaction.pendingCreation) {
					transaction[key].val = value
					transaction[key].changed = true
				} else {
					const origVal =
						origDataRef.current.transactions[transactionIndex][key].val
					transaction[key].val = value
					transaction[key].changed = value !== origVal
				}

				return clone
			})
		} else if (type === 'item') {
			const [item_id, transaction_id, key, value] = args as Data.UpdateItemArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					console.error(
						`Transaction "${transaction_id}" cannot be found in data.`,
						'\ndata.transactions:',
						structuredClone(data.transactions)
					)
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = clone.transactions[transactionIndex]
				const itemIndex = transaction.items.findIndex((item) => item.id === item_id)
				if (itemIndex === -1) {
					console.error(
						`Item "${item_id}" cannot be found in data.`,
						'This transaction:',
						structuredClone(transaction)
					)
					throw new Error(`Item "${item_id}" cannot be found in data`)
				}
				const item = transaction.items[itemIndex]
				if (transaction.pendingCreation || item.pendingCreation) {
					item[key].val = value
					item[key].changed = true
				} else {
					const oldVal =
						origDataRef.current.transactions[transactionIndex].items[itemIndex][
							key
						].val
					item[key].val = value
					item[key].changed = value !== oldVal
				}

				return clone
			})
		}
	}

	const stageDelete: Data.Delete = (type, ...args) => {
		if (type === 'transaction') {
			const [transaction_id, skipHistoryItem] = args as Data.DeleteTransactionArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					console.error(
						`Transaction "${transaction_id}" cannot be found in data.`,
						'\ndata.transactions:',
						structuredClone(dataRef.current.transactions)
					)
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = clone.transactions[transactionIndex]
				if (transaction.pendingCreation) {
					// remove item from array
					clone.transactions.splice(transactionIndex, 1)
				} else {
					// stage delete
					transaction.pendingDeletion = true
				}

				return clone
			})
			if (!skipHistoryItem && transaction_id.split('||')[0] !== 'PENDING_CREATION') {
				p.getHistoryController().add({
					type: 'transaction_deletion',
					transaction_id,
				})
				p.getHistoryController().clearRedo()
			}
		} else if (type === 'item') {
			const [item_id, transaction_id, skipHistoryItem] = args as Data.DeleteItemArgs
			const transactionIndex = dataRef.current.transactions.findIndex(
				(transaction) => transaction.id === transaction_id
			)
			if (transactionIndex === -1) {
				console.error(
					`Transaction "${transaction_id}" cannot be found in data.`,
					'dataRef.current.transactions:',
					structuredClone(dataRef.current.transactions)
				)
				throw new Error(`Transaction "${transaction_id}" cannot be found in data`)
			}
			const date = dataRef.current.transactions[transactionIndex].date.val
			const itemIndex = dataRef.current.transactions[transactionIndex].items.findIndex(
				(item) => item.id === item_id
			)
			if (itemIndex === -1) {
				console.error(
					`Item "${item_id}" cannot be found in data.`,
					'This transaction:',
					structuredClone(dataRef.current.transactions[transactionIndex])
				)
				throw new Error(`Item "${item_id}" cannot be found in data`)
			}

			setData((prev) => {
				const clone = structuredClone(prev)

				const transaction = clone.transactions[transactionIndex]
				const item = transaction.items[itemIndex]
				if (item.pendingCreation) {
					// remove item from array
					transaction.items.splice(itemIndex, 1)
				} else {
					// stage delete
					item.pendingDeletion = true
				}

				return clone
			})
			if (
				dataRef.current.transactions[transactionIndex].items[itemIndex]
					.pendingCreation === true
			) {
				p.getSortOrderController().removeNewItem(transaction_id, date, item_id)
			}
			if (!skipHistoryItem && item_id.split('||')[0] !== 'PENDING_CREATION') {
				p.getHistoryController().add({
					type: 'item_deletion',
					transaction_id,
					item_id,
				})
				p.getHistoryController().clearRedo()
			}
		}
	}

	const unstageDelete: Data.Delete = (type, ...args) => {
		if (type === 'transaction') {
			const [transaction_id, skipHistoryItem] = args as Data.DeleteTransactionArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					console.error(
						`Transaction "${transaction_id}" cannot be found in data.`,
						'\ndata.transactions:',
						structuredClone(data.transactions)
					)
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = clone.transactions[transactionIndex]
				transaction.pendingDeletion = false

				return clone
			})
			if (!skipHistoryItem && transaction_id.split('||')[0] !== 'PENDING_CREATION') {
				p.getHistoryController().add({
					type: 'transaction_deletion_reversed',
					transaction_id,
				})
				p.getHistoryController().clearRedo()
			}
		} else if (type === 'item') {
			const [item_id, transaction_id, skipHistoryItem] = args as Data.DeleteItemArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					console.error(
						`Transaction "${transaction_id}" cannot be found in data.`,
						'\ndata.transactions:',
						structuredClone(data.transactions)
					)
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = clone.transactions[transactionIndex]
				const itemIndex = transaction.items.findIndex((item) => item.id === item_id)
				if (itemIndex === -1) {
					console.error(
						`Item "${item_id}" cannot be found in data.`,
						'This transaction:',
						structuredClone(transaction)
					)
					throw new Error(`Item "${item_id}" cannot be found in data`)
				}
				const item = transaction.items[itemIndex]
				item.pendingDeletion = false

				return clone
			})
			if (!skipHistoryItem && item_id.split('||')[0] !== 'PENDING_CREATION') {
				p.getHistoryController().add({
					type: 'item_deletion_reversed',
					transaction_id,
					item_id,
				})
				p.getHistoryController().clearRedo()
			}
		}
	}

	const stageCreate: Data.Create = (type, ...args) => {
		if (type === 'transaction') {
			// NOT READY FOR INLINE TRANSACTION CREATION YET - will come in future update
			// const [transaction] = args as Data.CreateTransactionArgs
			// if (transaction.items.length === 0) {
			// 	throw new Error('New transaction must have at least one item provided.')
			// }
			// setData((prev) => {
			// 	const clone = structuredClone(prev)
			// 	const newTransaction: Data.StateTransaction = {
			// 		id: 'PENDING_CREATION||' + crypto.randomUUID(),
			// 		name: { val: transaction.name, changed: true },
			// 		date: { val: transaction.date, changed: true },
			// 		items: transaction.items.map((item) => ({
			// 			id: 'PENDING_CREATION||' + crypto.randomUUID(),
			// 			name: { val: item.name, changed: true },
			// 			amount: { val: item.amount, changed: true },
			// 			category_id: { val: item.category_id, changed: true },
			// 			account_id: { val: item.account_id, changed: true },
			// 			pendingCreation: true,
			// 			pendingDeletion: false,
			// 		})),
			// 		pendingCreation: true,
			// 		pendingDeletion: false,
			// 	}
			// 	clone.transactions.push(newTransaction)
			// 	return clone
			// })
			// p.getHistoryController().clearRedo()
		} else if (type === 'item') {
			const [transaction_id, itemInsertIndex, date, item] = args as Data.CreateItemArgs
			const newItemID = 'PENDING_CREATION||' + crypto.randomUUID()

			const transactionIndex = data.transactions.findIndex(
				(transaction) => transaction.id === transaction_id
			)
			if (transactionIndex - 1 === undefined) {
				console.error(
					`Transaction "${transaction_id}" couldn't be found in current data state.`,
					data.transactions
				)
				throw new Error(
					`Transaction "${transaction_id}" couldn't be found in current data state.`
				)
			}

			const firstItemID = data.transactions[transactionIndex].items[0].id

			setData((prev) => {
				const clone = structuredClone(prev)

				const transaction = clone.transactions[transactionIndex]

				const newItem =
					item !== undefined
						? {
								id: newItemID,
								name: { val: item.name, changed: true },
								amount: { val: item.amount, changed: true },
								category_id: { val: item.category_id, changed: true },
								account_id: { val: item.account_id, changed: true },
								pendingCreation: true,
								pendingDeletion: false,
						  }
						: {
								id: newItemID,
								name: { val: '', changed: true },
								amount: { val: '', changed: true },
								category_id: { val: '', changed: true },
								account_id: { val: '', changed: true },
								pendingCreation: true,
								pendingDeletion: false,
						  }

				transaction.items.push(newItem)

				return clone
			})
			p.getSortOrderController().addNewItem(
				transaction_id,
				date,
				newItemID,
				itemInsertIndex,
				firstItemID
			)
			p.getHistoryController().add({
				type: 'item_deletion_reversed',
				transaction_id,
				item_id: newItemID,
			})
			p.getHistoryController().clearRedo()
		}
	}

	// const unstageCreate: Data.Create

	const reload = async () => {
		setIsPendingSave(false)
		setIsLoading(true)
		const [transactionsRaw, categoriesRaw, accountsRaw] = await Promise.all([
			fetchTransactionData(getCurDateString(-14)),
			fetchCategoryData(),
			fetchAccountData(),
		])
		const transactions: Data.StateTransaction[] = transactionsRaw.map((transaction) => ({
			id: transaction.id,
			name: { val: transaction.name, changed: false },
			date: { val: transaction.date, changed: false, orig: transaction.date },
			pendingCreation: false,
			pendingDeletion: false,
			items: transaction.items.map((item) => ({
				id: item.id,
				name: { val: item.name, changed: false },
				category_id: {
					val: item.category_id !== null ? item.category_id : '',
					changed: false,
				},
				account_id: {
					val: item.account_id !== null ? item.account_id : '',
					changed: false,
				},
				amount: { val: item.amount.toFixed(2), changed: false },
				pendingCreation: false,
				pendingDeletion: false,
			})),
		}))

		const categories: Data.StateCategory[] = categoriesRaw.map((category) => ({
			id: category.id,
			name: category.name,
		}))
		const accounts: Data.StateAccount[] = accountsRaw.map((account) => ({
			id: account.id,
			name: account.name,
		}))

		const newData = { transactions, categories, accounts }

		setData(newData)
		origDataRef.current = structuredClone(newData)
		setIsLoading(false)
		if (p && p.onReload) {
			p.onReload(newData)
		}
	}

	const unstageCreate: Data.Create = (type, ...args) => {
		console.log('MEED TO MAKE')
	}

	const clearChanges = () => {
		console.log('NEED TO MAKE')
	}

	const controller: Data.Controller = {
		cur: data,
		def: origDataRef.current,
		update,
		stageDelete,
		stageCreate,
		isLoading,
		isPendingSave,
		reload,
		unstageDelete,
		clearChanges,
	}

	return controller
}

export namespace Data {
	export type State = {
		transactions: StateTransaction[]
		categories: StateCategory[]
		accounts: StateAccount[]
	}

	export type StateTransaction = {
		id: string
		name: { val: string; changed: boolean }
		date: { val: string; changed: boolean; orig: string }
		items: {
			id: string
			name: { val: string; changed: boolean }
			amount: { val: string; changed: boolean }
			category_id: { val: string; changed: boolean }
			account_id: { val: string; changed: boolean }
			pendingDeletion: boolean
			pendingCreation: boolean
		}[]
		pendingDeletion: boolean
		pendingCreation: boolean
	}
	export type StateCategory = {
		id: string
		name: string
	}
	export type StateAccount = {
		id: string
		name: string
	}

	export type Controller = {
		cur: Data.State
		def: Data.State
		update: Data.Update
		stageDelete: Data.Delete
		stageCreate: Data.Create
		isLoading: boolean
		isPendingSave: boolean
		reload: () => Promise<void>
		unstageDelete: Data.Delete
		clearChanges: () => void
	}

	export type Update = <T extends 'transaction' | 'item'>(
		type: T,
		...args: T extends 'transaction' ? UpdateTransactionArgs : UpdateItemArgs
	) => void
	export type UpdateTransactionArgs = [
		transaction_id: string,
		key: 'name' | 'date',
		value: string
	]
	export type UpdateItemArgs = [
		item_id: string,
		transaction_id: string,
		key: 'name' | 'amount' | 'category_id' | 'account_id',
		value: string
	]

	export type Create = <T extends 'transaction' | 'item'>(
		type: T,
		...args: T extends 'transaction' ? CreateTransactionArgs : CreateItemArgs
	) => void

	export type CreateTransactionArgs = [
		transaction: {
			name: string
			date: string
			items: {
				name: string
				amount: string
				category_id: string
				account_id: string
			}[]
		}
	]
	export type CreateItemArgs = [
		transaction_id: string,
		itemInsertIndex: number,
		date: string,
		item?: {
			name: string
			amount: string
			category_id: string
			account_id: string
		}
	]

	export type Delete = <T extends 'transaction' | 'item'>(
		type: T,
		...args: T extends 'transaction' ? DeleteTransactionArgs : DeleteItemArgs
	) => void

	export type DeleteTransactionArgs = [transaction_id: string, skipHistoryItem?: boolean]
	export type DeleteItemArgs = [
		item_id: string,
		transaction_id: string,
		skipHistoryItem?: boolean
	]
}
