import { upsertTiles } from '@/database'
import { Data } from '../hooks'
import { TileData } from '../tiles'
import { SetStateAction } from 'react'

export async function saveChanges(
	data: Data.Controller,
	tileData: TileData[],
	refreshAllData: () => Promise<void>,
	setIsLoading: (value: SetStateAction<boolean>) => void
) {
	if (data.isPendingSave) {
		const transactions = structuredClone(data.cur.transactions)
		const items = (() => {
			const remainingItems: {
				transaction_id: string
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
			}[] = []

			transactions.forEach((transaction) => {
				transaction.items.forEach((item) => {
					remainingItems.push({ ...item, transaction_id: transaction.id })
				})
			})
			return remainingItems
		})()

		const transactionsToCreate = transactions.filter(
			(transaction) => transaction.pendingCreation
		)

		const transactionsToDelete = transactions.filter(
			(transaction) => transaction.pendingDeletion
		)

		const itemsToCreate = items.filter((item) => item.pendingCreation)

		const itemsToDelete = items.filter((item) => item.pendingDeletion)

		// set up / assign sort order

		// create transactions

		// create items

		// delete transactions

		// delete items

		// apply changes
	}
	// check for tile changes

	// save tile changes
	setIsLoading(true)
	await upsertTiles(tileData)
	await refreshAllData()
	setIsLoading(false)
}
