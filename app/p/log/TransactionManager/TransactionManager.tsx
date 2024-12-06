'use client'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import s from './TransactionManager.module.scss'
import {
	isStandardError,
	moveItemInArray,
	promptError,
	removeFromArray,
	typedQuerySelectAll,
} from '@/utils'
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
import { JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { genSingleRow, GenSingleRowProps } from './func/genSingleRow/genSingleRow'
import { genMultiRow, GenMultiRowProps } from './func/genMultiRow/genMultiRow'
import { genGapRow } from './func/genGapRow/genGapRow'
import { handleTransactionReorder } from './func/handleTransactionReorder'
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
	const [isFoldedOrder, setIsFoldedOrder] = useState<boolean[]>([])
	const [counter, setCounter] = useState(0)

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
			setIsFoldedOrder(fetchedSortOrder.map(() => false))

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
			data.forEach((transaction, index) => {
				// add gap row
				if (index !== 0) {
					cells.push(genGapRow())
				}
				if (transaction.items.length === 1) {
					const props: GenSingleRowProps = {
						transaction,
						dropdownOptionsCategory,
						dropdownOptionsAccount,
						onResortMouseDown: (e) => {
							handleTransactionReorder(e, data, transaction, index)
						},
					}
					cells.push(genSingleRow(props))
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

					const props: GenMultiRowProps = {
						transaction: transactionSorted,
						categories: categories,
						accounts: accounts,
						dropdownOptionsCategory: dropdownOptionsCategory,
						dropdownOptionsAccount: dropdownOptionsAccount,
						handleTransactionItemReorder: (oldIndex, newIndex) => {
							handleTransactionItemReorder(transaction.id, oldIndex, newIndex)
						},
						folded: isFoldedOrder[index],
						onFold: () => {
							setIsFoldedOrder((prev) => {
								const newArr = [...prev]
								newArr[index] = true
								return newArr
							})
						},
						onUnfold: () => {
							setIsFoldedOrder((prev) => {
								const newArr = [...prev]
								newArr[index] = false
								return newArr
							})
						},
						onWholeResortMouseDown: (e) => {
							handleTransactionReorder(e, data, transaction, index)
						},
					}
					cells.push(genMultiRow(props))
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
		<div className={s.main}>
			<button onClick={() => setCounter((prev) => prev + 1)}>
				Counter: {counter}
			</button>
			TransactionManager<div>{loadState.loading ? loadState.message : 'Loaded!'}</div>
			<div>{grid}</div>
		</div>
	)
}
