'use client'
import { ReactNode, useEffect, useMemo, useState } from 'react'
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
import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
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

	const dropdownOptionsCategory: JDropdownTypes.Option[] = useMemo(() => {
		if (categories === null) {
			return []
		} else {
			return categories.map((cat) => {
				return {
					name: cat.name,
					value: cat.id,
				}
			})
		}
	}, [categories])
	const dropdownOptionsAccount: JDropdownTypes.Option[] = useMemo(() => {
		if (accounts === null) {
			return []
		} else {
			return accounts.map((act) => {
				return {
					name: act.name,
					value: act.id,
				}
			})
		}
	}, [accounts])

	const headers: JGridTypes.Header[] = [
		{ content: <div className={s.header_container}>Date</div>, defaultWidth: 100 },
		{ content: <div className={s.header_container}>Name</div>, defaultWidth: 300 },
		{ content: <div className={s.header_container}>Amount</div>, defaultWidth: 100 },
		{ content: <div className={s.header_container}>Category</div>, defaultWidth: 100 },
		{ content: <div className={s.header_container}>Account</div>, defaultWidth: 100 },
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
						{
							content: (
								<div className={s.data_container}>{transaction.date}</div>
							),
						},
						{
							content: (
								<div className={s.data_container}>
									<JInput value={transaction.name} />
								</div>
							),
						},
						{
							content: (
								<div className={s.data_container}>
									<JNumberAccounting value={transactionItem.amount} />
								</div>
							),
						},
						{
							content: (
								<div className={s.data_container}>
									<JDropdown
										options={dropdownOptionsCategory}
										defaultValue={
											transactionItem.category_id !== null
												? transactionItem.category_id
												: undefined
										}
									/>
								</div>
							),
						},
						{
							content: (
								<div className={s.data_container}>
									<JDropdown
										options={dropdownOptionsAccount}
										defaultValue={
											transactionItem.account_id !== null
												? transactionItem.account_id
												: undefined
										}
									/>
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
							{
								content: (
									<div className={s.data_container}>
										<JInput value={item.name} />
									</div>
								),
							},
							{
								content: (
									<div className={s.data_container}>
										<JNumberAccounting value={item.amount} />
									</div>
								),
							},
							{
								content: (
									<div className={s.data_container}>
										<JDropdown
											options={dropdownOptionsCategory}
											defaultValue={
												item.category_id !== null
													? item.category_id
													: undefined
											}
										/>
									</div>
								),
							},
							{
								content: (
									<div className={s.data_container}>
										<JDropdown
											options={dropdownOptionsAccount}
											defaultValue={
												item.account_id !== null
													? item.account_id
													: undefined
											}
										/>
									</div>
								),
							},
						]
					})
					const firstRow = [
						{
							content: (
								<div className={s.data_container}>{transaction.date}</div>
							),
						},
						{
							content: (
								<div className={s.data_container}>
									<JInput value={transaction.name} />
								</div>
							),
						},
						{
							content: (
								<div className={s.data_container}>
									<JNumberAccounting value={sum} disabled />
								</div>
							),
						},
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
			grid = <JGrid className={s.grid} {...gridConfig} />
		}
	}
	return (
		<div>
			TransactionManager<div>{loadState.loading ? loadState.message : 'Loaded!'}</div>
			<div>{grid}</div>
		</div>
	)
}
