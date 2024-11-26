'use client'
import { ReactNode, useEffect, useState } from 'react'
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
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
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
		console.log(
			'data loaded:\nCategories:',
			categories,
			'\nAccounts:',
			accounts,
			'\nTransactions:',
			data
		)
	}
	const headers: JGridTypes.Header[] = [
		{ content: <div>Date</div>, defaultWidth: 100 },
		{ content: <div>Name</div>, defaultWidth: 100 },
		{ content: <div>Amount</div>, defaultWidth: 100 },
		{ content: <div>Category</div>, defaultWidth: 100 },
		{ content: <div>Account</div>, defaultWidth: 100 },
	]
	let grid: ReactNode
	if (!loadState.loading && data !== null && categories !== null && accounts !== null) {
		if (data.length === 0) {
			grid = (
				<p>
					You do not have any transactions, click "Create new transaction" below to
					get started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = []
			data.forEach((transaction) => {
				if (transaction.items.length === 1) {
					const transactionItem = transaction.items[0]
					cells.push([
						{ content: <div>{transaction.date}</div> },
						{ content: <div>{transaction.name}</div> },
						{ content: <div>{transaction.items[0].amount}</div> },
						{
							content: (
								<div>
									{transactionItem.category_id === null
										? 'NULL'
										: categories.find(
												(cat) =>
													cat.id === transactionItem.category_id
										  )?.name}
								</div>
							),
						},
						{
							content: (
								<div>
									{transactionItem.account_id === null
										? 'NULL'
										: accounts.find(
												(act) =>
													act.id === transactionItem.account_id
										  )?.name}
								</div>
							),
						},
					])
				} else {
					let sum = 0
					const nextRows = transaction.items.map((item) => {
						sum += item.amount
						return [
							{ content: <></> },
							{ content: <div>{item.name}</div> },
							{ content: <div>{item.amount}</div> },
							{
								content: (
									<div>
										{item.category_id === null
											? 'NULL'
											: categories.find(
													(cat) => cat.id === item.category_id
											  )?.name}
									</div>
								),
							},
							{
								content: (
									<div>
										{item.account_id === null
											? 'NULL'
											: accounts.find(
													(act) => act.id === item.account_id
											  )?.name}
									</div>
								),
							},
						]
					})
					const firstRow = [
						{ content: <div>{transaction.date}</div> },
						{ content: <div>{transaction.name}</div> },
						{ content: <div>{sum}</div> },
						{ content: <></> },
						{ content: <></> },
					]
					cells.push(firstRow, ...nextRows)
				}
			})
			const gridConfig: JGridTypes.Props = {
				headers: headers,
				cells: cells,
			}
			grid = <JGrid {...gridConfig} />
		}
	}
	return (
		<div>
			TransactionManager<div>{loadState.loading ? loadState.message : 'Loaded!'}</div>
			<div>{grid}</div>
		</div>
	)
}
