import { useState } from 'react'
import { fetchAccountData, fetchCategoryData, fetchTransactionData } from '@/database'

export type UseDataOptions = {
	onReload?: (newData: Data.State) => void
}
export function useData(p?: UseDataOptions) {
	const [data, setData] = useState<Data.State>({
		transactions: [],
		categories: [],
		accounts: [],
	})
	const [origData, setOrigData] = useState<Data.State>({
		transactions: [],
		categories: [],
		accounts: [],
	})
	const [isLoading, setIsLoading] = useState(false)
	const [isPendingSave, setIsPendingSave] = useState(false)

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
						data.transactions
					)
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = data.transactions[transactionIndex]
				if (transaction.pendingCreation) {
					transaction[key].val = value
					transaction[key].changed = true
				} else {
					const origVal = origData.transactions[transactionIndex][key].val
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
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = data.transactions[transactionIndex]
				const itemIndex = transaction.items.findIndex((item) => item.id === item_id)
				if (itemIndex === -1) {
					throw new Error(`Item "${item_id}" cannot be found in data`)
				}
				const item = transaction.items[itemIndex]
				if (transaction.pendingCreation || item.pendingCreation) {
					item[key].val = value
					item[key].changed = true
				} else {
					const oldVal =
						origData.transactions[transactionIndex].items[itemIndex][key].val
					item[key].val = value
					item[key].changed = value === oldVal
				}

				return clone
			})
		}
	}

	const stageDelete: Data.Delete = (type, ...args) => {
		if (type === 'transaction') {
			const [transaction_id] = args as Data.DeleteTransactionArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = data.transactions[transactionIndex]
				if (transaction.pendingCreation) {
					// remove item from array
					clone.transactions.slice(transactionIndex, 1)
				} else {
					// stage delete
					transaction.pendingDeletion = true
				}

				return clone
			})
		} else if (type === 'item') {
			const [item_id, transaction_id] = args as Data.DeleteItemArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = data.transactions[transactionIndex]
				const itemIndex = transaction.items.findIndex((item) => item.id === item_id)
				if (itemIndex === -1) {
					throw new Error(`Item "${item_id}" cannot be found in data`)
				}
				const item = transaction.items[itemIndex]
				if (item.pendingCreation) {
					// remove item from array
					transaction.items.slice(itemIndex, 1)
				} else {
					// stage delete
					item.pendingDeletion = true
				}

				return clone
			})
		}
	}

	const unstageDelete: Data.Delete = (type, ...args) => {
		if (type === 'transaction') {
			const [transaction_id] = args as Data.DeleteTransactionArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = data.transactions[transactionIndex]
				transaction.pendingDeletion = false

				return clone
			})
		} else if (type === 'item') {
			const [item_id, transaction_id] = args as Data.DeleteItemArgs
			setData((prev) => {
				const clone = structuredClone(prev)
				const transactionIndex = clone.transactions.findIndex(
					(transaction) => transaction.id === transaction_id
				)
				if (transactionIndex === -1) {
					throw new Error(
						`Transaction "${transaction_id}" cannot be found in data`
					)
				}
				const transaction = data.transactions[transactionIndex]
				const itemIndex = transaction.items.findIndex((item) => item.id === item_id)
				if (itemIndex === -1) {
					throw new Error(`Item "${item_id}" cannot be found in data`)
				}
				const item = transaction.items[itemIndex]
				item.pendingDeletion = false

				return clone
			})
		}
	}

	const stageCreate: Data.Create = (type, ...args) => {
		if (type === 'transaction') {
			const [transaction] = args as Data.CreateTransactionArgs
			if (transaction.items.length === 0) {
				throw new Error('New transaction must have at least one item provided.')
			}
			console.log('NEED TO MAKE')
			// setData((prev) => {
			// 	const clone = structuredClone(prev)

			// 	const newTransaction: Data.State['transactions'][number] = {
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
		} else if (type === 'item') {
			const [transaction_id, position, item] = args as Data.CreateItemArgs
			console.log('NEED TO MAKE')
			setData((prev) => {
				const clone = structuredClone(prev)
				return clone
			})
		}
	}

	const reload = async () => {
		if (isPendingSave) {
			throw new Error('Cannot reload data while pending save.')
		} else if (isLoading) {
			throw new Error('Cannot reload data while  already loading.')
		}
		const [transactionsRaw, categoriesRaw, accountsRaw] = await Promise.all([
			fetchTransactionData(),
			fetchCategoryData(),
			fetchAccountData(),
		])
		const transactions: Data.StateTransaction[] = transactionsRaw.map((transaction) => ({
			id: transaction.id,
			name: { val: transaction.name, changed: false },
			date: { val: transaction.date, changed: false },
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
			name: { val: category.name, changed: false },
		}))
		const accounts: Data.StateAccount[] = accountsRaw.map((account) => ({
			id: account.id,
			name: { val: account.name, changed: false },
			starting_amount: { val: account.starting_amount.toFixed(2), changed: false },
		}))

		const newData = { transactions, categories, accounts }

		setData(newData)
		setOrigData(newData)
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
		date: { val: string; changed: boolean }
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
		name: { val: string; changed: boolean }
	}
	export type StateAccount = {
		id: string
		name: { val: string; changed: boolean }
		starting_amount: { val: string; changed: boolean }
	}

	export type Controller = {
		cur: Data.State
		update: Data.Update
		stageDelete: Data.Delete
		stageCreate: Data.Create
		isLoading: boolean
		isPendingSave: boolean
		reload: () => void
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
		position: {
			rel: 'above' | 'below'
			item_id: string
		},
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

	export type DeleteTransactionArgs = [transaction_id: string]
	export type DeleteItemArgs = [item_id: string, transaction_id: string]
}
