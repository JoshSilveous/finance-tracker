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
export type SortOrder = {
	[date: string]: SortOrderItem[]
}
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
	const [defaultSortOrder, setDefaultSortOrder] = useState<SortOrder>({})
	const [currentSortOrder, setCurrentSortOrder] = useState<SortOrder>({})
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

	// used for testing new SortOrder system
	useEffect(() => {
		// console.log('new sort order update!', readableSortOrder(newCurrentSortOrder))
	}, [currentSortOrder])
	function readableSortOrder(sortOrder: SortOrder) {
		const debugDisplaySortOrder: SortOrder = {}
		Object.entries(sortOrder).forEach((item) => {
			debugDisplaySortOrder[item[0]] = item[1].map((item) => {
				if (Array.isArray(item)) {
					const thisTrans = data!.find((trans) => trans.id === item[0])!
					const otherItems = structuredClone(item)
					otherItems.shift()
					const otherItemsNamed = otherItems.map((item) => {
						return thisTrans.items.find((it) => it.id === item)?.name!
					})
					return [thisTrans!.name, ...otherItemsNamed]
				} else {
					const thisTrans = data?.find((trans) => trans.id === item)!
					return thisTrans.name
				}
			})
		})
		return debugDisplaySortOrder
	}
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
			setFoldState,
			setCategories,
			setAccounts,
			setDefaultSortOrder,
			setCurrentSortOrder
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
		(transaction: FetchedTransaction, transactionIndex: number) =>
			(oldItemIndex: number, newItemIndex: number) => {
				setCurrentSortOrder((prev) => {
					const clone = structuredClone(prev)

					const thisTransactionOrder = clone[transaction.date][
						transactionIndex
					] as string[]

					moveItemInArray(thisTransactionOrder, oldItemIndex + 1, newItemIndex + 1)

					return clone
				})
			},
		[]
	)
	const updateTransactionSortOrder = useCallback(
		(date: string) => (oldIndex: number, newIndex: number) => {
			setCurrentSortOrder((prev) => {
				const clone = structuredClone(prev)

				moveItemInArray(clone[date], oldIndex, newIndex)

				return clone
			})
		},
		[]
	)

	const organizedData = useMemo(() => {
		if (data === null || currentSortOrder === null) {
			return null
		} else {
			const entries = Object.entries(currentSortOrder)
			const sortAndGrouped = entries.map((entry) => {
				return {
					date: entry[0],
					transactions: entry[1].map((sortItem) => {
						if (Array.isArray(sortItem)) {
							const newItems: FetchedTransaction['items'] = []
							const thisTransaction = data.find(
								(item) => item.id === sortItem[0]
							)!

							sortItem.forEach((itemID, index) => {
								if (index === 0) return
								newItems.push(
									thisTransaction.items.find((item) => item.id === itemID)!
								)
							})
							return { ...thisTransaction, items: newItems }
						} else {
							return data.find((item) => item.id === sortItem)!
						}
					}),
				}
			})
			return sortAndGrouped
		}
	}, [data, currentSortOrder])

	let grid: ReactNode

	if (
		!loadState.loading &&
		categories !== null &&
		accounts !== null &&
		defaultSortOrder !== null &&
		currentSortOrder !== null &&
		organizedData !== null
	) {
		if (organizedData.length === 0) {
			grid = (
				<p>
					You do not have any transactions, click "Create new transaction" below to
					get started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = []

			organizedData.forEach((groupedItem) => {
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
								updateTransactionSortOrder(groupedItem.date),
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
						const props: MultiRowProps = {
							transaction: transaction,
							dropdownOptionsCategory: dropdownOptionsCategory,
							dropdownOptionsAccount: dropdownOptionsAccount,
							onItemReorder: updateItemSortOrder(transaction, index),
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
								updateTransactionSortOrder(groupedItem.date),
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
