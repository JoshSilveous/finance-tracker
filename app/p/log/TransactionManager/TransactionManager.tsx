'use client'
import { useEffect, useState } from 'react'
import s from './TransactionManager.module.scss'
import { isStandardError, promptError } from '@/utils'
import {
	fetchCategoryData,
	FetchedTransaction,
	fetchTransactionData,
	fetchCategoryTotals,
	FetchedAccount,
	FetchedCategory,
	fetchAccountData,
} from '@/database'
interface LoadState {
	loading: boolean
	message: string
}
export function TransactionManager() {
	const [categories, setCategories] = useState<FetchedCategory[] | null>(null)
	const [accounts, setAccounts] = useState<FetchedAccount[] | null>(null)
	const [data, setData] = useState<FetchedTransaction[] | null>(null)
	const [loadState, setLoadState] = useState<LoadState>({
		loading: true,
		message: 'Loading',
	})

	async function fetchAndLoadData() {
		try {
			setLoadState({ loading: true, message: 'Fetching Transaction Data' })
			const transactionData = await fetchTransactionData()
			setData(transactionData)

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
	useEffect(() => {
		fetchAndLoadData()
	}, [])
	if (!loadState.loading) {
		console.log('data loaded:\n', categories, '\n', accounts, '\n', data)
	}
	return (
		<div>
			TransactionManager<div>{loadState.loading ? loadState.message : 'Loaded!'}</div>
		</div>
	)
}
