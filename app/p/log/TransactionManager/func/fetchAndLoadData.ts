import {
	fetchAccountData,
	fetchCategoryData,
	fetchCategoryTotals,
	FetchedAccount,
	FetchedCategory,
	FetchedTransaction,
	fetchTransactionData,
} from '@/database'
import { isStandardError, promptError } from '@/utils'
import { Dispatch, SetStateAction } from 'react'
import { FoldState, LoadState, SortOrder, SortOrderItem } from '../TransactionManager'

export async function fetchAndLoadData(
	setLoadState: Dispatch<SetStateAction<LoadState>>,
	setData: Dispatch<SetStateAction<FetchedTransaction[] | null>>,
	setFoldState: Dispatch<SetStateAction<FoldState>>,
	setCategories: Dispatch<SetStateAction<FetchedCategory[] | null>>,
	setAccounts: Dispatch<SetStateAction<FetchedAccount[] | null>>,
	setDefaultSortOrder: Dispatch<SetStateAction<SortOrder>>,
	setCurrentSortOrder: Dispatch<SetStateAction<SortOrder>>
) {
	try {
		setLoadState({ loading: true, message: 'Fetching Transaction Data' })
		const transactionData = await fetchTransactionData()
		setData(transactionData)

		let groupedData: { date: string; transactions: FetchedTransaction[] }[] = []
		transactionData.forEach((transaction) => {
			const thisDateIndex = groupedData.findIndex(
				(item) => item.date === transaction.date
			)

			if (thisDateIndex === -1) {
				groupedData.push({ date: transaction.date, transactions: [transaction] })
			} else {
				groupedData[thisDateIndex].transactions.push(transaction)
			}
		})

		// Get sort order
		let sortOrder: SortOrder = {}
		groupedData.forEach((groupItem) => {
			sortOrder[groupItem.date] = groupItem.transactions.map((transaction) => {
				if (transaction.items.length === 1) {
					return transaction.id
				} else {
					return [transaction.id, ...transaction.items.map((item) => item.id)]
				}
			})
		})
		setCurrentSortOrder(sortOrder)
		setDefaultSortOrder(sortOrder)

		setFoldState(() => {
			const foldState: FoldState = {}
			transactionData.forEach((transaction) => {
				if (transaction.items.length > 1) {
					foldState[transaction.id] = false
				}
			})
			return foldState
		})

		setLoadState({ loading: true, message: 'Fetching Category Data' })
		const categoryData = await fetchCategoryData()
		setCategories(categoryData)

		setLoadState({ loading: true, message: 'Fetching Account Data' })
		const accountData = await fetchAccountData()
		setAccounts(accountData)
		setLoadState({ loading: false, message: '' })
		fetchCategoryTotals()
	} catch (e) {
		if (isStandardError(e)) {
			promptError(
				'An unexpected error has occurred while fetching your data from the database:',
				e.message,
				'Try refreshing the page to resolve this issue.'
			)
		}
	}
}
