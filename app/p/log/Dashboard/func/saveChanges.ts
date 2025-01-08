import {
	deleteItems,
	deleteTransactions,
	getTransactionsCount,
	insertItems,
	UpsertItemEntry,
	upsertTiles,
	UpsertTransactionEntry,
	upsertTransactionsAndItems,
} from '@/database'
import { Data, SortOrder } from '../hooks'
import { TileData } from '../tiles'
import { SetStateAction } from 'react'

export async function saveChanges(
	data: Data.Controller,
	tileData: TileData[],
	sortOrder: SortOrder.Controller,
	refreshAllData: () => Promise<void>,
	setIsLoading: (value: SetStateAction<boolean>) => void
) {
	if (data.isPendingSave) {
		//	1. Filter transactions and items into separate arrays
		const transactions = (() => {
			return structuredClone(
				data.cur.transactions.map(({ items, ...rest }) => ({ ...rest }))
			) as {
				order_position?: number
				id: string
				name: {
					val: string
					changed: boolean
				}
				date: {
					val: string
					changed: boolean
					orig: string
				}
				pendingDeletion: boolean
				pendingCreation: boolean
			}[]
		})()
		const items = (() => {
			const remainingItems: {
				parentTransaction: Data.StateTransaction
				id: string
				name: {
					val: string
					changed: boolean
				}
				amount: {
					val: string
					changed: boolean
				}
				category_id: {
					val: string
					changed: boolean
				}
				account_id: {
					val: string
					changed: boolean
				}
				pendingDeletion: boolean
				pendingCreation: boolean
				order_position?: number
			}[] = []

			data.cur.transactions.forEach((transaction) => {
				transaction.items.forEach((item) => {
					remainingItems.push({ ...item, parentTransaction: transaction })
				})
			})
			return remainingItems
		})()

		//	2. Move deletions from both arrays into separate arrays
		const deletedTransactions = transactions.filter((trn) => trn.pendingDeletion)
		const deletedItems = items.filter((item) => item.pendingDeletion)

		//	3. Remove deleted from transactions and items arrays
		deletedTransactions.forEach((trn) =>
			transactions.splice(transactions.indexOf(trn), 1)
		)
		deletedItems.forEach((item) => items.splice(items.indexOf(item), 1))

		//	4. Apply order_position changes for transactions + items where needed
		const curSortOrderAfterChanges = (() => {
			const curSortOrderAfterChanges = structuredClone(sortOrder.cur)
			transactions.forEach((transaction) => {
				if (transaction.date.changed === true) {
					// remove transaction from current sort order
					const index = curSortOrderAfterChanges[transaction.date.orig].findIndex(
						(sortItem) =>
							Array.isArray(sortItem)
								? sortItem[0] === transaction.id
								: sortItem === transaction.id
					)
					const removedSortItem = curSortOrderAfterChanges[
						transaction.date.orig
					].splice(index, 1)[0]

					// place transaction at end of sortOrder for new date (appears at the top for the user)
					curSortOrderAfterChanges[transaction.date.val] ||= []
					curSortOrderAfterChanges[transaction.date.val].push(removedSortItem)
				}
			})
			deletedTransactions.forEach((transaction) => {
				const index = curSortOrderAfterChanges[transaction.date.orig].findIndex(
					(si) =>
						Array.isArray(si) ? si[0] === transaction.id : si === transaction.id
				)
				curSortOrderAfterChanges[transaction.date.orig].splice(index, 1)
			})
			deletedItems.forEach((item) => {
				const origDate = item.parentTransaction.date.orig
				const transaction_id = item.parentTransaction.id
				const transactionIndex = curSortOrderAfterChanges[origDate].findIndex((si) =>
					Array.isArray(si) ? si[0] === transaction_id : si === transaction_id
				)
				if (transactionIndex === -1) {
					return
				}
				const sortOrder = curSortOrderAfterChanges[origDate][
					transactionIndex
				] as string[]
				const itemIndex = sortOrder.indexOf(item.id)

				sortOrder.splice(itemIndex, 1)
			})
			return curSortOrderAfterChanges
		})()

		// flip sort orders per date (since transactions are reversed)
		Object.keys(curSortOrderAfterChanges).forEach((key) => {
			curSortOrderAfterChanges[key].reverse()
		})

		const orderPositionPromises: Promise<any>[] = []
		transactions.forEach((transaction) => {
			if (sortOrder.cur[transaction.date.val] !== undefined) {
				// sort order entry already exists for this date
				const curOrderPosition = curSortOrderAfterChanges[
					transaction.date.val
				].findIndex((sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === transaction.id
						: sortItem === transaction.id
				)

				const defOrderPosition = sortOrder.def[transaction.date.val].findIndex(
					(sortItem) =>
						Array.isArray(sortItem)
							? sortItem[0] === transaction.id
							: sortItem === transaction.id
				)

				if (curOrderPosition !== defOrderPosition) {
					transaction.order_position = curOrderPosition
				}
			} else {
				// the date has been changed, and we don't know how many items exist for this date. we will query the DB, figure out how many transactions exist under this date, and add the item

				const index = curSortOrderAfterChanges[transaction.date.val].findIndex(
					(sortItem) =>
						Array.isArray(sortItem)
							? sortItem[0] === transaction.id
							: sortItem === transaction.id
				)

				orderPositionPromises.push(
					getTransactionsCount(transaction.date.val).then((count) => {
						transaction.order_position = count + 1 + index
					})
				)
			}
		})
		items.forEach((item) => {
			const curTransactionSort = sortOrder.cur[item.parentTransaction.date.orig].find(
				(sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === item.parentTransaction.id
						: sortItem === item.parentTransaction.id
			)
			const curOrderPosition = Array.isArray(curTransactionSort)
				? curTransactionSort.indexOf(item.id)
				: 1

			const defTransactionSort = sortOrder.def[item.parentTransaction.date.orig].find(
				(sortItem) =>
					Array.isArray(sortItem)
						? sortItem[0] === item.parentTransaction.id
						: sortItem === item.parentTransaction.id
			)
			const defOrderPosition = Array.isArray(defTransactionSort)
				? defTransactionSort.indexOf(item.id)
				: 1

			if (curOrderPosition !== defOrderPosition) {
				item.order_position = curOrderPosition + 1
			}
		})

		await Promise.all(orderPositionPromises)

		//	5. Move creations from both arrays into separate arrays
		// note: transactions cannot be created this way yet, only by using the "Create New Transaction" form.
		const createdItems = items.filter((item) => item.pendingCreation)

		//	6. Move creations from both arrays into separate
		createdItems.forEach((item) => items.splice(items.indexOf(item), 1))

		// 	7. Filter out unchanged transactions + items
		const changedTransactions = transactions.filter(
			(transaction) =>
				transaction.order_position !== undefined ||
				transaction.date.changed ||
				transaction.name.changed
		)
		const changedItems = items.filter(
			(item) =>
				item.order_position !== undefined ||
				item.account_id.changed ||
				item.category_id.changed ||
				item.name.changed ||
				item.amount.changed
		)

		// 	8. Filter out arrays where transaction has been deleted (database handles cascading automatically)
		deletedTransactions.forEach((transaction) => {
			;(() => {
				const itemIndexesToRemove: number[] = []
				deletedItems.forEach((item, index) => {
					if (item.parentTransaction.id === transaction.id) {
						itemIndexesToRemove.push(index)
					}
				})
				itemIndexesToRemove.forEach((itmIndx, indx) =>
					deletedItems.splice(itmIndx - indx, 1)
				)
			})()
			;(() => {
				const itemIndexesToRemove: number[] = []
				createdItems.forEach((item, index) => {
					if (item.parentTransaction.id === transaction.id) {
						itemIndexesToRemove.push(index)
					}
				})
				itemIndexesToRemove.forEach((itmIndx, indx) =>
					createdItems.splice(itmIndx - indx, 1)
				)
			})()
			;(() => {
				const itemIndexesToRemove: number[] = []
				changedItems.forEach((item, index) => {
					if (item.parentTransaction.id === transaction.id) {
						itemIndexesToRemove.push(index)
					}
				})
				itemIndexesToRemove.forEach((itmIndx, indx) =>
					changedItems.splice(itmIndx - indx, 1)
				)
			})()
		})

		//  9. Prepare database queries
		const deleteTransactionsPromise = deleteTransactions(
			deletedTransactions.map((trn) => trn.id)
		)
		const deleteItemsPromise = deleteItems(deletedItems.map((itm) => itm.id))

		const upsertPromise = (() => {
			const mergedTransactions: UpsertTransactionEntry[] = changedTransactions.map(
				(trn) => ({
					id: trn.id,
					name: trn.name.val,
					date: trn.date.val,
					order_position: trn.order_position,
				})
			)

			const mergedItems: UpsertItemEntry[] = [
				...changedItems.map((itm) => {
					const thisItem = {
						id: itm.id,
						account_id: itm.account_id.val,
						category_id: itm.category_id.val,
						name: itm.name.val,
						amount: itm.amount.val,
						transaction_id: itm.parentTransaction.id,
					} as UpsertItemEntry
					if (itm.order_position !== undefined) {
						thisItem.order_position = itm.order_position
					}
					return thisItem
				}),
				...createdItems.map((itm) => {
					const thisItem = {
						account_id: itm.account_id.val,
						category_id: itm.category_id.val,
						name: itm.name.val,
						amount: itm.amount.val,
						transaction_id: itm.parentTransaction.id,
					} as UpsertItemEntry
					if (itm.order_position !== undefined) {
						thisItem.order_position = itm.order_position
					}
					return thisItem
				}),
			]

			return upsertTransactionsAndItems(mergedTransactions, mergedItems)
		})()

		await Promise.all([deleteTransactionsPromise, deleteItemsPromise])
		await upsertPromise
	}
	// check for tile changes

	// save tile changes

	setIsLoading(true)
	await upsertTiles(tileData)
	await refreshAllData()
	setIsLoading(false)
}
