// import {
// 	deleteItems,
// 	deleteTransactions,
// 	FetchedTransaction,
// 	insertItems,
// 	UpsertItemEntry,
// 	UpsertTransactionEntry,
// 	upsertTransactionsAndItems,
// } from '@/database'
// import { PendingChangeController, SortOrder } from '../hooks'
// import { MutableRefObject } from 'react'
// import { FormTransaction } from '../TransactionManager'
// import { delay } from '@/utils'

// export async function saveChanges(
// 	pendingChanges: PendingChangeController,
// 	sortOrder: SortOrder.Controller,
// 	transactionData: MutableRefObject<FormTransaction[] | null>
// ) {
// 	const changesCopy = structuredClone(pendingChanges.changes.cur)
// 	const sortOrderCopy = {
// 		cur: structuredClone(sortOrder.cur),
// 		def: structuredClone(sortOrder.def),
// 	}

// 	// 1. isolate items to be deleted
// 	const itemDeletePromise = (() => {
// 		if (pendingChanges.deletions.cur.items.length === 0) {
// 			return null
// 		}
// 		pendingChanges.deletions.cur.items.forEach((item_id) => {
// 			// remove from changes
// 			delete changesCopy.items[item_id]

// 			// remove for current sortOrder
// 			Object.entries(sortOrder.cur).forEach(([date, sortItems]) => {
// 				sortItems.forEach((sortItem) => {
// 					if (Array.isArray(sortItem) && sortItem.includes(item_id)) {
// 						sortItem.splice(sortItem.indexOf(item_id), 1)
// 					}
// 				})
// 			})
// 		})

// 		return deleteItems(pendingChanges.deletions.cur.items)
// 	})()

// 	// 2. isolate transactions to be deleted
// 	const transactionDeletePromise = (() => {
// 		if (pendingChanges.deletions.cur.transactions.length === 0) {
// 			return null
// 		}
// 		pendingChanges.deletions.cur.transactions.forEach((transaction_id) => {
// 			// remove from changes
// 			delete changesCopy.transactions[transaction_id]

// 			// remove for current sortOrder
// 			Object.entries(sortOrder.cur).forEach(([date, sortItems]) => {
// 				sortItems.forEach((sortItem, index) => {
// 					if (
// 						(Array.isArray(sortItem) && sortItem[0] === transaction_id) ||
// 						sortItem === transaction_id
// 					) {
// 						sortItems.splice(index, 1)
// 					}
// 				})
// 			})
// 		})

// 		return deleteTransactions(pendingChanges.deletions.cur.transactions)
// 	})()

// 	// 3. determine item order_position changes
// 	const itemPositionUpdates: { id: string; order_position: number }[] = (() => {
// 		const itemPositionUpdates: { id: string; order_position: number }[] = []

// 		Object.entries(sortOrderCopy.cur).forEach(([date, sortItems]) => {
// 			sortItems.forEach((sortItem) => {
// 				if (Array.isArray(sortItem)) {
// 					const defOrder = sortOrderCopy.def[date].find(
// 						(it) => Array.isArray(it) && it[0] === sortItem[0]
// 					)
// 					if (defOrder === undefined) {
// 						// a new item was added to a transaction that previously only had one
// 						sortItem.forEach((id, index) => {
// 							if (index !== 0) {
// 								itemPositionUpdates.push({
// 									id: id,
// 									order_position: index - 1,
// 								})
// 							}
// 						})
// 					} else {
// 						sortItem.forEach((id, index) => {
// 							if (index !== 0 && id !== defOrder[index]) {
// 								itemPositionUpdates.push({
// 									id: id,
// 									order_position: index - 1,
// 								})
// 							}
// 						})
// 					}
// 				}
// 			})
// 		})

// 		return itemPositionUpdates
// 	})()

// 	// 4. insert new items with new order position
// 	const insertItemsPromise = (() => {
// 		if (pendingChanges.creations.cur.items.length === 0) {
// 			return null
// 		}
// 		const newItems = pendingChanges.creations.cur.items.map((entry) => {
// 			let newItemData = changesCopy.items[entry.id]

// 			if (newItemData === undefined) {
// 				// handles case where a user adds a new item, but doesn't fill out any info, and hits save
// 				newItemData = {}
// 			}

// 			const posUpdateIndex = itemPositionUpdates.findIndex(
// 				(update) => update.id === entry.id
// 			)

// 			const order_position = itemPositionUpdates[posUpdateIndex].order_position

// 			// remove entry from itemPositionUpdates once used
// 			itemPositionUpdates.splice(posUpdateIndex, 1)

// 			return {
// 				temp_id: entry.id,
// 				item: {
// 					name: newItemData.name !== undefined ? newItemData.name : '',
// 					amount: newItemData.amount !== undefined ? newItemData.amount : '',
// 					category_id:
// 						newItemData.category_id !== undefined &&
// 						newItemData.category_id !== ''
// 							? newItemData.category_id
// 							: null,
// 					account_id:
// 						newItemData.account_id !== undefined && newItemData.account_id !== ''
// 							? newItemData.account_id
// 							: null,

// 					transaction_id: entry.transaction_id,
// 					order_position: order_position,
// 				},
// 			}
// 		})
// 		return insertItems(newItems.map((entry) => entry.item))
// 	})()

// 	// 5. package up items for upsertion
// 	const packagedItems: UpsertItemEntry[] = (() => {
// 		const packagedItems: UpsertItemEntry[] = []

// 		// add items with value changes
// 		Object.entries(changesCopy.items).forEach(([id, changes]) => {
// 			if (!pendingChanges.creations.check(id)) {
// 				const origTransaction = transactionData.current!.find((transaction) =>
// 					transaction.items.some((item) => item.id === id)
// 				)!
// 				const origItem = origTransaction.items.find((item) => item.id === id)!

// 				const newOrderPositionUpdateIndex = itemPositionUpdates.findIndex(
// 					(it) => it.id === id
// 				)

// 				const order_position =
// 					newOrderPositionUpdateIndex !== -1
// 						? itemPositionUpdates[newOrderPositionUpdateIndex].order_position
// 						: origItem.order_position

// 				if (newOrderPositionUpdateIndex !== -1) {
// 					// remove entry from itemPositionUpdates once used
// 					itemPositionUpdates.splice(newOrderPositionUpdateIndex, 1)
// 				}

// 				const name = changes.name !== undefined ? changes.name : origItem.name
// 				const category_id =
// 					changes.category_id !== undefined
// 						? changes.category_id !== ''
// 							? changes.category_id
// 							: null
// 						: origItem.category_id
// 				const account_id =
// 					changes.account_id !== undefined
// 						? changes.account_id !== ''
// 							? changes.account_id
// 							: null
// 						: origItem.account_id

// 				packagedItems.push({
// 					id,
// 					order_position,
// 					name,
// 					category_id,
// 					account_id,
// 					amount: changes.amount !== undefined ? changes.amount : origItem.amount,
// 					transaction_id: origTransaction.id,
// 				})
// 			}
// 		})

// 		// add remaining items with only order_position changes
// 		itemPositionUpdates.forEach((thisItem) => {
// 			const origTransaction = transactionData.current!.find((transaction) =>
// 				transaction.items.some((item) => item.id === thisItem.id)
// 			)!
// 			const origItem = origTransaction.items.find((item) => item.id === thisItem.id)!
// 			packagedItems.push({
// 				...origItem,
// 				transaction_id: origTransaction.id,
// 				order_position: thisItem.order_position,
// 			})
// 		})

// 		return packagedItems
// 	})()

// 	// 6. determine transaction order_position changes
// 	const transactionPositionUpdates: { id: string; order_position: number }[] = (() => {
// 		const transactionPositionUpdates: { id: string; order_position: number }[] = []

// 		Object.entries(sortOrderCopy.cur).forEach(([date, sortItems]) => {
// 			sortItems.forEach((sortItem, currentIndex) => {
// 				const transaction_id = Array.isArray(sortItem) ? sortItem[0] : sortItem
// 				const defaultIndex = sortOrderCopy.def[date].findIndex((sortItem) =>
// 					Array.isArray(sortItem)
// 						? sortItem[0] === transaction_id
// 						: sortItem === transaction_id
// 				)
// 				if (defaultIndex !== currentIndex) {
// 					transactionPositionUpdates.push({
// 						id: transaction_id,
// 						order_position: sortItems.length - currentIndex, // sort order is reversed for transactions so newest appears at top
// 					})
// 				}
// 			})
// 		})

// 		return transactionPositionUpdates
// 	})()

// 	// 7. package up transactions for upsertion
// 	const packagedTransactions: UpsertTransactionEntry[] = (() => {
// 		const packagedTransactions: UpsertTransactionEntry[] = []
// 		// add transactions with value changes
// 		Object.entries(changesCopy.transactions).forEach(([id, changes]) => {
// 			const original = transactionData.current!.find(
// 				(transaction) => transaction.id === id
// 			)!
// 			const newOrderPositionUpdateIndex = transactionPositionUpdates.findIndex(
// 				(it) => it.id === id
// 			)

// 			const order_position =
// 				newOrderPositionUpdateIndex !== -1
// 					? transactionPositionUpdates[newOrderPositionUpdateIndex].order_position
// 					: original.order_position

// 			if (newOrderPositionUpdateIndex !== -1) {
// 				transactionPositionUpdates.splice(newOrderPositionUpdateIndex, 1)
// 			}
// 			packagedTransactions.push({
// 				id,
// 				order_position,
// 				date: changes.date !== undefined ? changes.date : original.date,
// 				name: changes.name !== undefined ? changes.name : original.name,
// 			})
// 		})

// 		// add remaining transactions with only order_position changes
// 		transactionPositionUpdates.forEach((item) => {
// 			const { items, ...original } = transactionData.current!.find(
// 				(transaction) => transaction.id === item.id
// 			)!
// 			packagedTransactions.push({
// 				...original,
// 				order_position: item.order_position,
// 			})
// 		})

// 		return packagedTransactions
// 	})()

// 	// 8. prepare upsert promise
// 	const upsertPromise = (() => {
// 		if (packagedTransactions.length === 0 && packagedItems.length === 0) {
// 			return null
// 		} else {
// 			return upsertTransactionsAndItems(packagedTransactions, packagedItems)
// 		}
// 	})()

// 	// 9. run promises
// 	const promises = [
// 		itemDeletePromise,
// 		transactionDeletePromise,
// 		insertItemsPromise,
// 		upsertPromise,
// 	].filter((promise) => promise !== null)

// 	await Promise.all(promises)
// 	return
// }
export const hi = 'hi'
