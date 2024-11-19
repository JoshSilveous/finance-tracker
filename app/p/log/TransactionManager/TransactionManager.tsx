'use client'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import s from './TransactionManager.module.scss'
import { fetchData } from './func/clientFunctions'
import { fetchData as fetchCategories } from '../../categories/CategoryManager/func/clientFunctions'
import { fetchData as fetchAccounts } from '../../accounts/AccountManager/func/clientFunctions'
import { isStandardError, promptError } from '@/utils'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
export function TransactionManager() {
	const [categories, setCategories] = useState<Category.Full[] | null>(null)
	const [accounts, setAccounts] = useState<Account.Full[] | null>(null)
	const [data, setData] = useState<Transaction.Full[] | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	async function loadData() {
		try {
			const [transactionData, categoryData, accountData] = await Promise.all([
				fetchData(),
				fetchCategories(),
				fetchAccounts(),
			])
			setData(transactionData)
			setCategories(categoryData)
			setAccounts(accountData)
			setIsLoading(false)
		} catch (e) {
			if (isStandardError(e)) {
				promptError(
					'An unexpected error has occurred while fetching your transaction data from the database:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
			}
		}
	}
	useEffect(() => {
		loadData()
	}, [])
	if (!isLoading) {
		console.log('data loaded:\n', categories, '\n', accounts, '\n', data)
	}
	return <div>TransactionManager</div>
}
