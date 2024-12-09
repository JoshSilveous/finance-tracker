'use client'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
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
import { handleTransactionReorderMouseDown } from './func/handleTransactionReorder'

interface LoadState {
	loading: boolean
	message: string
}
export interface FoldState {
	transaction_id: string
	folded: boolean
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
	const [counter, setCounter] = useState(0)
	// previous foldOrder is needed to detect when it actually changes between animations (to play animation)
	const [foldStateArr, setFoldStateArr] = useState<FoldState[]>([])
	const prevFoldStateRef = useRef<FoldState[] | null>(null)
	useEffect(() => {
		prevFoldStateRef.current = foldStateArr
	}, [foldStateArr])

	useEffect(() => {
		fetchAndLoadData()
	}, [])

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

	function updateTransactionItemSortOrder(
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
	function updateTransactionSortOrder(oldIndex: number, newIndex: number) {
		setCurrentSortOrder((prev) => {
			const newArr = structuredClone(prev) as SortOrderItem[]
			moveItemInArray(newArr, oldIndex, newIndex)
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
			const dataSorted = currentSortOrder.map((sortedID) => {
				if (Array.isArray(sortedID)) {
					return data.find((item) => item.id === sortedID[0])!
				} else {
					return data.find((item) => item.id === sortedID)!
				}
			})
			dataSorted.forEach((transaction, index) => {
				if (transaction.items.length === 1) {
					const props: GenSingleRowProps = {
						transaction,
						transactionIndex: index,
						dropdownOptionsCategory,
						dropdownOptionsAccount,
						onResortMouseDown: (e) => {
							handleTransactionReorderMouseDown(
								e,
								dataSorted,
								transaction,
								index,
								updateTransactionSortOrder
							)
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

					const handleTransactionItemReorder = (
						oldIndex: number,
						newIndex: number
					) => {
						updateTransactionItemSortOrder(transaction.id, oldIndex, newIndex)
					}

					const folded = foldStateArr.find(
						(item) => item.transaction_id === transaction.id
					)!.folded

					const playAnimation =
						prevFoldStateRef.current !== null
							? foldStateArr.find(
									(item) => item.transaction_id === transaction.id
							  )!.folded !==
							  prevFoldStateRef.current!.find(
									(item) => item.transaction_id === transaction.id
							  )!.folded
							: false

					const onWholeResortMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
						handleTransactionReorderMouseDown(
							e,
							dataSorted,
							transaction,
							index,
							updateTransactionSortOrder
						)
					}

					const props: GenMultiRowProps = {
						transaction: transactionSorted,
						categories: categories,
						accounts: accounts,
						dropdownOptionsCategory: dropdownOptionsCategory,
						dropdownOptionsAccount: dropdownOptionsAccount,
						handleTransactionItemReorder,
						folded,
						playAnimation,
						prevIsFoldedOrderRef: prevFoldStateRef,
						transactionIndex: index,
						setFoldStateArr,
						onWholeResortMouseDown,
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
