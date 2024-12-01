'use client'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import s from './TransactionManager.module.scss'
import { isStandardError, moveItemInArray, promptError, removeFromArray } from '@/utils'
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
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { genMultiRow, genSingleRow } from './func/row_gen/row_gen'
interface LoadState {
	loading: boolean
	message: string
}
type SortOrderItem = string | string[]
export function TransactionManager() {
	const [categories, setCategories] = useState<FetchedCategory[] | null>(null)
	const [accounts, setAccounts] = useState<FetchedAccount[] | null>(null)
	const [data, setData] = useState<FetchedTransaction[] | null>(null)
	const [loadState, setLoadState] = useState<LoadState>({
		loading: true,
		message: 'Loading',
	})
	const [defaultSortOrder, setDefaultSortOrder] = useState<SortOrderItem[] | null>(null)
	const [currentSortOrder, setCurrentSortOrder] = useState<SortOrderItem[] | null>(null)

	async function fetchAndLoadData() {
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
			data,
			'\ndefaultSortOrder:',
			defaultSortOrder,
			'\ncurrentSortOrder:',
			currentSortOrder
		)
	}

	const dropdownOptionsCategory: JDropdownTypes.Option[] = useMemo(() => {
		if (categories === null) {
			return []
		} else {
			const options = categories.map((cat) => {
				return {
					name: cat.name,
					value: cat.id,
				}
			})
			options.unshift({ name: 'None', value: 'none' })
			return options
		}
	}, [categories])
	const dropdownOptionsAccount: JDropdownTypes.Option[] = useMemo(() => {
		if (accounts === null) {
			return []
		} else {
			const options = accounts.map((act) => {
				return {
					name: act.name,
					value: act.id,
				}
			})
			options.unshift({ name: 'None', value: 'none' })
			return options
		}
	}, [accounts])

	const headers: JGridTypes.Header[] = [
		{
			content: <div className={s.header_container}>CNTRL</div>,
			defaultWidth: 75,
			noResize: true,
		},
		{ content: <div className={s.header_container}>Date</div>, defaultWidth: 125 },
		{ content: <div className={s.header_container}>Name</div>, defaultWidth: 250 },
		{ content: <div className={s.header_container}>Amount</div>, defaultWidth: 100 },
		{ content: <div className={s.header_container}>Category</div>, defaultWidth: 150 },
		{ content: <div className={s.header_container}>Account</div>, defaultWidth: 150 },
	]

	let grid: ReactNode

	function handleTransactionItemReorder(
		transaction_id: string,
		oldItemIndex: number,
		newItemIndex: number
	) {
		setCurrentSortOrder((prev) => {
			const newArr = structuredClone(prev) as SortOrderItem[]
			const thisTransactionIndex = newArr.findIndex(
				(item) => Array.isArray(item) && item[0] === transaction_id
			)
			const thisTransactionSortOrder = newArr[thisTransactionIndex] as string[]
			moveItemInArray(thisTransactionSortOrder, oldItemIndex + 1, newItemIndex + 1)
			return newArr
		})
	}

	if (
		!loadState.loading &&
		data !== null &&
		categories !== null &&
		accounts !== null &&
		defaultSortOrder !== null &&
		currentSortOrder !== null
	) {
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
					cells.push(
						genSingleRow(
							transaction,
							dropdownOptionsCategory,
							dropdownOptionsAccount
						)
					)
				} else {
					const sortedItemOrder = currentSortOrder.find(
						(sortItem) =>
							Array.isArray(sortItem) && sortItem[0] === transaction.id
					) as string[]
					const sortedItems = removeFromArray(sortedItemOrder, 0).map(
						(item_id) => {
							return transaction.items.find((item) => item.id === item_id)
						}
					) as FetchedTransaction['items']

					const transactionSorted = { ...transaction, items: sortedItems }
					console.log(
						'original transaction:',
						transaction,
						'\n sorted:',
						transactionSorted
					)
					cells.push(
						...genMultiRow(
							transactionSorted,
							categories,
							accounts,
							dropdownOptionsCategory,
							dropdownOptionsAccount,
							(oldIndex, newIndex) => {
								handleTransactionItemReorder(
									transaction.id,
									oldIndex,
									newIndex
								)
							}
						)
					)
				}
			})
			const gridConfig: JGridTypes.Props = {
				headers: headers,
				cells: cells,
				noBorders: true,
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
