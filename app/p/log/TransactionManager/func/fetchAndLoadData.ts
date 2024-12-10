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
import { FoldState, LoadState, SortOrderItem } from '../TransactionManager'

export async function fetchAndLoadData(
	setLoadState: Dispatch<SetStateAction<LoadState>>,
	setData: Dispatch<SetStateAction<FetchedTransaction[] | null>>,
	setDefaultSortOrder: Dispatch<SetStateAction<SortOrderItem[] | null>>,
	setCurrentSortOrder: Dispatch<SetStateAction<SortOrderItem[] | null>>,
	setFoldStateArr: Dispatch<SetStateAction<FoldState[]>>,
	setCategories: Dispatch<SetStateAction<FetchedCategory[] | null>>,
	setAccounts: Dispatch<SetStateAction<FetchedAccount[] | null>>
) {
	try {
		setLoadState({ loading: true, message: 'Fetching Transaction Data' })
		const transactionData = await fetchTransactionData()
		setData(transactionData)

		const fetchedSortOrder = transactionData.map((transaction) => {
			if (transaction.items.length === 1) {
				return transaction.id
			} else {
				return [transaction.id, ...transaction.items.map((item) => item.id)]
			}
		})
		setDefaultSortOrder(fetchedSortOrder)
		setCurrentSortOrder(fetchedSortOrder)
		setFoldStateArr(
			fetchedSortOrder.map((item) => {
				return {
					transaction_id: Array.isArray(item) ? item[0] : item,
					folded: false,
				}
			})
		)

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
