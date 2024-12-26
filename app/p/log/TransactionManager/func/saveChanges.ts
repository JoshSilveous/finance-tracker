import {
	FetchedTransaction,
	UpsertItemEntry,
	UpsertTransactionEntry,
	upsertTransactionsAndItems,
} from '@/database'
import { PendingChanges, SortOrder } from '../hooks'
import { MutableRefObject } from 'react'
import { FormTransaction } from '../TransactionManager'

export async function saveChanges(
	pendingChanges: PendingChanges.Controller,
	sortOrder: SortOrder.Controller,
	transactionData: MutableRefObject<FormTransaction[] | null>
) {
	const itemPositionUpdates: { id: string; order_position: number }[] = []
	const transactionPositionUpdates: { id: string; order_position: number }[] = []

	// check for item order position updates
	Object.entries(sortOrder.cur).forEach(([date, sortItems]) => {
		sortItems.forEach((sortItem) => {
			if (Array.isArray(sortItem)) {
				const defOrder = sortOrder.def[date].find(
					(it) => Array.isArray(it) && it[0] === sortItem[0]
				)!
				sortItem.forEach((id, index) => {
					if (index !== 0 && id !== defOrder[index]) {
						itemPositionUpdates.push({ id: id, order_position: index - 1 })
					}
				})
			}
		})
	})

	// check for transaction order position updates
	Object.entries(sortOrder.cur).forEach(([date, sortItems]) => {
		sortItems.forEach((sortItem, currentIndex) => {
			const transaction_id = Array.isArray(sortItem) ? sortItem[0] : sortItem
			const defaultIndex = sortOrder.def[date].findIndex((sortItem) =>
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

	// package up transaction changes
	const packagedTransactions: UpsertTransactionEntry[] = Object.entries(
		pendingChanges.curChanges.transactions
	).map(([id, changes]) => {
		const original = transactionData.current!.find(
			(transaction) => transaction.id === id
		)!
		const newOrderPositionUpdateIndex = transactionPositionUpdates.findIndex(
			(it) => it.id === id
		)
		if (newOrderPositionUpdateIndex !== -1) {
			transactionPositionUpdates.splice(newOrderPositionUpdateIndex, 1)
		}

		const order_position =
			newOrderPositionUpdateIndex !== -1
				? transactionPositionUpdates[newOrderPositionUpdateIndex].order_position
				: original.order_position

		return {
			id,
			order_position,
			date: changes.date !== undefined ? changes.date : original.date,
			name: changes.name !== undefined ? changes.name : original.name,
		}
	})
	// add remaining transaction order position updates
	transactionPositionUpdates.forEach((item) => {
		const { items, ...original } = transactionData.current!.find(
			(transaction) => transaction.id === item.id
		)!
		packagedTransactions.push({ ...original, order_position: item.order_position })
	})

	// package up transaction changes
	const packagedItems: UpsertItemEntry[] = Object.entries(
		pendingChanges.curChanges.items
	).map(([id, changes]) => {
		const origTransaction = transactionData.current!.find((transaction) =>
			transaction.items.some((item) => item.id === id)
		)!
		const origItem = origTransaction.items.find((item) => item.id === id)!
		const newOrderPositionUpdateIndex = itemPositionUpdates.findIndex(
			(it) => it.id === id
		)
		if (newOrderPositionUpdateIndex !== -1) {
			itemPositionUpdates.splice(newOrderPositionUpdateIndex, 1)
		}
		const order_position =
			newOrderPositionUpdateIndex !== -1
				? itemPositionUpdates[newOrderPositionUpdateIndex].order_position
				: origItem.order_position

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

		return {
			id,
			order_position,
			name,
			category_id,
			account_id,
			amount: changes.amount !== undefined ? changes.amount : origItem.amount,
			transaction_id: origTransaction.id,
		}
	})
	// add remaining transaction order position updates
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

	await upsertTransactionsAndItems(packagedTransactions, packagedItems)

	return
}
