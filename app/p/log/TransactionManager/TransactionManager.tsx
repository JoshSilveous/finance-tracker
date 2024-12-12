'use client'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import s from './TransactionManager.module.scss'
import { moveItemInArray, removeFromArray } from '@/utils'
import { FetchedTransaction, FetchedAccount, FetchedCategory } from '@/database'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { handleTransactionReorder } from './func/handleTransactionReorder'
import { fetchAndLoadData } from './func/fetchAndLoadData'
import { MultiRow, MultiRowProps } from './MultiRow/MultiRow'
import { SingleRow, SingleRowProps } from './SingleRow/SingleRow'
import { DateRow } from './DateRow/DateRow'

export interface LoadState {
	loading: boolean
	message: string
}
export type SortOrderItem = string | string[]
export type TransactionRowsRef = {
	[key: string]: HTMLDivElement | null
}
export type FoldState = {
	[key: string]: boolean
}
/**
 * Used to update a specific transaction's `foldState` in a concise way.
 * @param transaction_id
 * @param folded the value to set the `foldState` to. Leave undefined to toggle.
 */
export type FoldStateUpdater = (transaction_id: string, folded?: boolean) => void

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

	const transactionRowsRef = useRef<TransactionRowsRef>({})
	const setTransactionRowRef = (transaction_id: string) => (node: HTMLInputElement) => {
		transactionRowsRef.current[transaction_id] = node
	}

	// previous foldState is needed to detect when it actually changes between animations (to play animation)
	const [foldState, setFoldState] = useState<FoldState>({})
	const prevFoldStateRef = useRef<FoldState>({})
	useEffect(() => {
		prevFoldStateRef.current = foldState
	}, [foldState])
	/**
	 * See {@link FoldStateUpdater}
	 */
	const updateFoldState: FoldStateUpdater = useCallback((transaction_id, folded) => {
		setFoldState((prev) => {
			const newState = structuredClone(prev)
			newState[transaction_id] =
				folded !== undefined ? folded : !newState[transaction_id]
			return newState
		})
	}, [])

	useEffect(() => {
		fetchAndLoadData(
			setLoadState,
			setData,
			setDefaultSortOrder,
			setCurrentSortOrder,
			setFoldState,
			setCategories,
			setAccounts
		)
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

	const headers: JGridTypes.Header[] = useMemo(() => {
		return [
			{
				content: <div className={s.header_container}>CNTRL</div>,
				defaultWidth: 75,
				noResize: true,
			},
			{
				content: <div className={s.header_container}>Date</div>,
				defaultWidth: 140,
				minWidth: 105,
				maxWidth: 150,
			},
			{
				content: <div className={s.header_container}>Name</div>,
				defaultWidth: 260,
				minWidth: 160,
				maxWidth: 300,
			},
			{
				content: <div className={s.header_container}>Amount</div>,
				defaultWidth: 140,
				minWidth: 95,
				maxWidth: 160,
			},
			{
				content: <div className={s.header_container}>Category</div>,
				defaultWidth: 170,
				minWidth: 110,
				maxWidth: 200,
			},
			{
				content: <div className={s.header_container}>Account</div>,
				defaultWidth: 170,
				minWidth: 110,
				maxWidth: 200,
			},
		]
	}, [])

	const updateItemSortOrder = useCallback(
		(transaction_id: string, oldItemIndex: number, newItemIndex: number) => {
			setCurrentSortOrder((prev) => {
				const newArr = structuredClone(prev) as SortOrderItem[]
				const thisTransactionIndex = newArr.findIndex(
					(item) => Array.isArray(item) && item[0] === transaction_id
				)
				const thisTransactionSortOrder = newArr[thisTransactionIndex] as string[]
				moveItemInArray(thisTransactionSortOrder, oldItemIndex + 1, newItemIndex + 1)
				return newArr
			})
		},
		[]
	)
	const updateTransactionSortOrder = useCallback((oldIndex: number, newIndex: number) => {
		setCurrentSortOrder((prev) => {
			const newArr = structuredClone(prev) as SortOrderItem[]
			moveItemInArray(newArr, oldIndex, newIndex)
			return newArr
		})
	}, [])

	const sortedData = useMemo(() => {
		if (data === null || currentSortOrder === null) {
			return null
		} else {
			return currentSortOrder!.map((sortedID) => {
				if (Array.isArray(sortedID)) {
					return data!.find((item) => item.id === sortedID[0])!
				} else {
					return data!.find((item) => item.id === sortedID)!
				}
			})
		}
	}, [data, currentSortOrder])

	const sortedAndGroupedData = useMemo(() => {
		if (data === null || currentSortOrder === null) {
			return null
		} else {
			const sortedData = currentSortOrder!.map((sortedID) => {
				if (Array.isArray(sortedID)) {
					return data!.find((item) => item.id === sortedID[0])!
				} else {
					return data!.find((item) => item.id === sortedID)!
				}
			})
			let grouped: { date: string; transactions: FetchedTransaction[] }[] = []
			sortedData.forEach((transaction) => {
				const thisDateIndex = grouped.findIndex(
					(item) => item.date === transaction.date
				)

				if (thisDateIndex === -1) {
					grouped.push({ date: transaction.date, transactions: [transaction] })
				} else {
					grouped[thisDateIndex].transactions.push(transaction)
				}
			})
			return grouped
		}
	}, [data, currentSortOrder])

	let grid: ReactNode

	if (
		!loadState.loading &&
		categories !== null &&
		accounts !== null &&
		defaultSortOrder !== null &&
		currentSortOrder !== null &&
		sortedData !== null &&
		sortedAndGroupedData !== null
	) {
		if (sortedData.length === 0) {
			grid = (
				<p>
					You do not have any transactions, click "Create new transaction" below to
					get started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = []

			sortedAndGroupedData.forEach((groupedItem) => {
				cells.push(<DateRow date={groupedItem.date} />)
				groupedItem.transactions.forEach((transaction, index) => {
					if (transaction.items.length === 1) {
						const props: SingleRowProps = {
							transaction,
							placeMarginAbove: index !== 0,
							dropdownOptionsCategory,
							dropdownOptionsAccount,
							onResortMouseDown: handleTransactionReorder(
								groupedItem.transactions,
								transaction,
								index,
								updateTransactionSortOrder,
								transactionRowsRef,
								foldState[transaction.id],
								updateFoldState
							),
						}
						cells.push(
							<SingleRow
								{...props}
								ref={setTransactionRowRef(transaction.id)}
							/>
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

						const props: MultiRowProps = {
							transaction: transactionSorted,
							dropdownOptionsCategory: dropdownOptionsCategory,
							dropdownOptionsAccount: dropdownOptionsAccount,
							onItemReorder: (oldIndex, newIndex) => {
								updateItemSortOrder(transaction.id, oldIndex, newIndex)
							},
							folded: foldState[transaction.id],
							playAnimation:
								prevFoldStateRef.current[transaction.id] === undefined
									? false
									: prevFoldStateRef.current[transaction.id] !==
									  foldState[transaction.id],
							placeMarginAbove: index !== 0,
							updateFoldState,
							onTransactionReorderMouseDown: handleTransactionReorder(
								groupedItem.transactions,
								transaction,
								index,
								updateTransactionSortOrder,
								transactionRowsRef,
								foldState[transaction.id],
								updateFoldState
							),
						}

						cells.push(
							<MultiRow
								{...props}
								ref={setTransactionRowRef(transaction.id)}
							/>
						)
					}
				})
			})
			const gridConfig: JGridTypes.Props = {
				headers: headers,
				cells: cells,
				noBorders: true,
				maxTableWidth: 1000,
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
