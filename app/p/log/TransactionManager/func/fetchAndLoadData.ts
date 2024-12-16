import {
	fetchAccountData,
	fetchCategoryData,
	FetchedAccount,
	FetchedCategory,
	fetchTransactionData,
} from '@/database'
import { isStandardError, promptError } from '@/utils'
import { Dispatch, SetStateAction } from 'react'
import { FoldState, SortOrder, FormTransaction } from '../TransactionManager'

export async function fetchAndLoadData(
	setLoaded: Dispatch<SetStateAction<boolean>>,
	setTransactionData: Dispatch<SetStateAction<FormTransaction[] | null>>,
	setFoldState: Dispatch<SetStateAction<FoldState>>,
	setCategoryData: Dispatch<SetStateAction<FetchedCategory[] | null>>,
	setAccountData: Dispatch<SetStateAction<FetchedAccount[] | null>>,
	setDefSortOrder: Dispatch<SetStateAction<SortOrder>>,
	setCurSortOrder: Dispatch<SetStateAction<SortOrder>>
) {
	setLoaded(false)
	Promise.all([fetchTransactionData(), fetchCategoryData(), fetchAccountData()])
		.then((res) => {
			const [transactions, categories, accounts] = res

			// generate default sort order
			const sortOrder: SortOrder = {}
			transactions.forEach((transaction) => {
				if (sortOrder[transaction.date] === undefined) {
					if (transaction.items.length > 1) {
						sortOrder[transaction.date] = [
							[transaction.id, ...transaction.items.map((item) => item.id)],
						]
					} else {
						sortOrder[transaction.date] = [transaction.id]
					}
				} else {
					if (transaction.items.length > 1) {
						sortOrder[transaction.date] = [
							...sortOrder[transaction.date],
							[transaction.id, ...transaction.items.map((item) => item.id)],
						]
					} else {
						sortOrder[transaction.date] = [
							...sortOrder[transaction.date],
							transaction.id,
						]
					}
				}
			})

			// generate default fold state
			const foldState: FoldState = {}
			transactions.forEach((transaction) => {
				if (transaction.items.length > 1) {
					foldState[transaction.id] = false
				}
			})

			// convert FetchedTransaction to StateTransaction
			const convertedTransactions: FormTransaction[] = transactions.map(
				(transaction) => ({
					...transaction,
					items: transaction.items.map((item) => ({
						...item,
						amount: item.amount.toFixed(2),
					})),
				})
			)

			setTransactionData(convertedTransactions)
			setCategoryData(categories)
			setAccountData(accounts)

			setDefSortOrder(sortOrder)
			setCurSortOrder(sortOrder)

			setFoldState(foldState)
			setLoaded(true)
		})
		.catch((e) => {
			if (isStandardError(e)) {
				promptError(
					'An unexpected error has occurred while fetching your data from the database:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
			}
		})
}
