import { useEffect, useRef, useState } from 'react'
import { fetchAccountData, fetchCategoryData, fetchTransactionData } from '@/database'
import { areDeeplyEqual } from '@/utils'
import { SortOrder } from '../useSortOrder'

export type UseDataOptions = {
	onReload?: (newData: Data.State) => void
	getSortOrderController: () => SortOrder.Controller
}
export function useData(p?: UseDataOptions) {
	const [data, setData] = useState<Data.State>({
		transactions: [],
		categories: [],
		accounts: [],
	})
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
			const [transaction_id] = args as Data.DeleteTransactionArgs
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
		} else if (type === 'item') {
			const [item_id, transaction_id] = args as Data.DeleteItemArgs
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
		}
	}

	const stageCreate: Data.Create = (type, ...args) => {
		if (type === 'transaction') {
			const [transaction] = args as Data.CreateTransactionArgs
			if (transaction.items.length === 0) {
				throw new Error('New transaction must have at least one item provided.')
			}
			setData((prev) => {
				const clone = structuredClone(prev)

				const newTransaction: Data.StateTransaction = {
					id: 'PENDING_CREATION||' + crypto.randomUUID(),
					name: { val: transaction.name, changed: true },
					date: { val: transaction.date, changed: true },
					items: transaction.items.map((item) => ({
						id: 'PENDING_CREATION||' + crypto.randomUUID(),
						name: { val: item.name, changed: true },
						amount: { val: item.amount, changed: true },
						category_id: { val: item.category_id, changed: true },
						account_id: { val: item.account_id, changed: true },
						pendingCreation: true,
						pendingDeletion: false,
					})),
					pendingCreation: true,
					pendingDeletion: false,
				}
				clone.transactions.push(newTransaction)
				return clone
			})
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
			p!.getSortOrderController().setCurrent((prev) => {
				const clone = structuredClone(prev)

				const transactionIndex = clone[date].findIndex((sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === transaction_id
						: sortItem === transaction_id
				)

				if (Array.isArray(clone[date][transactionIndex])) {
					clone[date][transactionIndex].splice(itemInsertIndex, 0, newItemID)
				} else {
					clone[date][transactionIndex] = [
						clone[date][transactionIndex],
						firstItemID,
						newItemID,
					]
				}
				console.log('prev', structuredClone(prev), 'clone', structuredClone(clone))

				return clone
			})
		}
	}

	const reload = async () => {
		if (isPendingSave) {
			throw new Error('Cannot reload data while pending save.')
		} else if (isLoading) {
			throw new Error('Cannot reload data while already loading.')
		}
		setIsLoading(true)
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
			amtBeforeCurrentTransactions: 0, // will change once page-by-page transaction loading is added
		}))
		const accounts: Data.StateAccount[] = accountsRaw.map((account) => ({
			id: account.id,
			name: { val: account.name, changed: false },
			starting_amount: { val: account.starting_amount.toFixed(2), changed: false },
			amtBeforeCurrentTransactions: 0, // will change once page-by-page transaction loading is added
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
		amtBeforeCurrentTransactions: number
	}
	export type StateAccount = {
		id: string
		name: { val: string; changed: boolean }
		starting_amount: { val: string; changed: boolean }
		amtBeforeCurrentTransactions: number
	}

	export type Controller = {
		cur: Data.State
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

	export type DeleteTransactionArgs = [transaction_id: string]
	export type DeleteItemArgs = [item_id: string, transaction_id: string]
}
