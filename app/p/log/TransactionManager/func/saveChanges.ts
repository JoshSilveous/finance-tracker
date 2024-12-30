import {
	FetchedTransaction,
	insertItems,
	UpsertItemEntry,
	UpsertTransactionEntry,
	upsertTransactionsAndItems,
} from '@/database'
import { PendingChangeController, SortOrder } from '../hooks'
import { MutableRefObject } from 'react'
import { FormTransaction } from '../TransactionManager'

export async function saveChanges(
	pendingChanges: PendingChangeController,
	sortOrder: SortOrder.Controller,
	transactionData: MutableRefObject<FormTransaction[] | null>
) {
	const changesCopy = structuredClone(pendingChanges.changes.cur)
	const sortOrderCopy = {
		cur: structuredClone(sortOrder.cur),
		def: structuredClone(sortOrder.def),
	}

	// 1. determine item order_position changes
	const itemPositionUpdates: { id: string; order_position: number }[] = (() => {
		const itemPositionUpdates: { id: string; order_position: number }[] = []

		Object.entries(sortOrderCopy.cur).forEach(([date, sortItems]) => {
			sortItems.forEach((sortItem) => {
				if (Array.isArray(sortItem)) {
					const defOrder = sortOrderCopy.def[date].find(
						(it) => Array.isArray(it) && it[0] === sortItem[0]
					)
					if (defOrder === undefined) {
						// a new item was added to a transaction that previously only had one
						sortItem.forEach((id, index) => {
							if (index !== 0) {
								itemPositionUpdates.push({
									id: id,
									order_position: index - 1,
								})
							}
						})
					} else {
						sortItem.forEach((id, index) => {
							if (index !== 0 && id !== defOrder[index]) {
								itemPositionUpdates.push({
									id: id,
									order_position: index - 1,
								})
							}
						})
					}
				}
			})
		})

		return itemPositionUpdates
	})()
	console.log('itemPositionUpdates', itemPositionUpdates)

	// 2. insert new items with new order position
	const insertItemsPromise = (() => {
		if (pendingChanges.creations.cur.items.length === 0) {
			return null
		}
		const newItems = pendingChanges.creations.cur.items.map((entry) => {
			const newItemData = changesCopy.items[entry.id]

			const posUpdateIndex = itemPositionUpdates.findIndex(
				(update) => update.id === entry.id
			)

			const order_position = itemPositionUpdates[posUpdateIndex].order_position

			// remove entry from itemPositionUpdates once used
			itemPositionUpdates.splice(posUpdateIndex, 1)

			return {
				temp_id: entry.id,
				item: {
					name: newItemData.name !== undefined ? newItemData.name : '',
					amount: newItemData.amount !== undefined ? newItemData.amount : '',
					category_id:
						newItemData.category_id !== undefined &&
						newItemData.category_id !== ''
							? newItemData.category_id
							: null,
					account_id:
						newItemData.account_id !== undefined && newItemData.account_id !== ''
							? newItemData.account_id
							: null,

					transaction_id: entry.transaction_id,
					order_position: order_position,
				},
			}
		})
		return insertItems(newItems.map((entry) => entry.item))
	})()

	// 3. package up items for upsertion
	const packagedItems: UpsertItemEntry[] = (() => {
		const packagedItems: UpsertItemEntry[] = []

		// add items with value changes
		Object.entries(changesCopy.items).forEach(([id, changes]) => {
			if (!pendingChanges.creations.check(id)) {
				const origTransaction = transactionData.current!.find((transaction) =>
					transaction.items.some((item) => item.id === id)
				)!
				const origItem = origTransaction.items.find((item) => item.id === id)!

				const newOrderPositionUpdateIndex = itemPositionUpdates.findIndex(
					(it) => it.id === id
				)

				const order_position =
					newOrderPositionUpdateIndex !== -1
						? itemPositionUpdates[newOrderPositionUpdateIndex].order_position
						: origItem.order_position

				if (newOrderPositionUpdateIndex !== -1) {
					// remove entry from itemPositionUpdates once used
					itemPositionUpdates.splice(newOrderPositionUpdateIndex, 1)
				}

				const name = changes.name !== undefined ? changes.name : origItem.name
				const category_id =
					changes.category_id !== undefined
						? changes.category_id !== ''
							? changes.category_id
							: null
						: origItem.category_id
				const account_id =
					changes.account_id !== undefined
						? changes.account_id !== ''
							? changes.account_id
							: null
						: origItem.account_id

				packagedItems.push({
					id,
					order_position,
					name,
					category_id,
					account_id,
					amount: changes.amount !== undefined ? changes.amount : origItem.amount,
					transaction_id: origTransaction.id,
				})
			}
		})

		// add remaining items with only order_position changes
		itemPositionUpdates.forEach((thisItem) => {
			const origTransaction = transactionData.current!.find((transaction) =>
				transaction.items.some((item) => item.id === thisItem.id)
			)!
			const origItem = origTransaction.items.find((item) => item.id === thisItem.id)!
			packagedItems.push({
				...origItem,
				transaction_id: origTransaction.id,
				order_position: thisItem.order_position,
			})
		})

		return packagedItems
	})()

	// 4. determine transaction order_position changes
	const transactionPositionUpdates: { id: string; order_position: number }[] = (() => {
		const transactionPositionUpdates: { id: string; order_position: number }[] = []

		Object.entries(sortOrderCopy.cur).forEach(([date, sortItems]) => {
			sortItems.forEach((sortItem, currentIndex) => {
				const transaction_id = Array.isArray(sortItem) ? sortItem[0] : sortItem
				const defaultIndex = sortOrderCopy.def[date].findIndex((sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === transaction_id
						: sortItem === transaction_id
				)
				if (defaultIndex !== currentIndex) {
					transactionPositionUpdates.push({
						id: transaction_id,
						order_position: currentIndex,
					})
				}
			})
		})

		return transactionPositionUpdates
	})()

	// 5. package up transactions for upsertion
	const packagedTransactions: UpsertTransactionEntry[] = (() => {
		const packagedTransactions: UpsertTransactionEntry[] = []

		// add transactions with value changes
		Object.entries(changesCopy.transactions).forEach(([id, changes]) => {
			const original = transactionData.current!.find(
				(transaction) => transaction.id === id
			)!
			const newOrderPositionUpdateIndex = transactionPositionUpdates.findIndex(
				(it) => it.id === id
			)

			const order_position =
				newOrderPositionUpdateIndex !== -1
					? transactionPositionUpdates[newOrderPositionUpdateIndex].order_position
					: original.order_position

			if (newOrderPositionUpdateIndex !== -1) {
				transactionPositionUpdates.splice(newOrderPositionUpdateIndex, 1)
			}
			return {
				id,
				order_position,
				date: changes.date !== undefined ? changes.date : original.date,
				name: changes.name !== undefined ? changes.name : original.name,
			}
		})

		// add remaining transactions with only order_position changes
		transactionPositionUpdates.forEach((item) => {
			const { items, ...original } = transactionData.current!.find(
				(transaction) => transaction.id === item.id
			)!
			packagedTransactions.push({
				...original,
				order_position: item.order_position,
			})
		})

		return packagedTransactions
	})()

	// 6. run promises
	const upsertPromise = upsertTransactionsAndItems(packagedTransactions, packagedItems)

	if (insertItemsPromise === null) {
		await upsertPromise
		return
	} else {
		Promise.all([insertItemsPromise, upsertPromise]).then(() => {
			return
		})
	}
}
