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
import { sortTransactions } from './func/organizeTransactions'

export type SortOrderItem = string | string[]
export type SortOrder = {
	[date: string]: SortOrderItem[]
}
export type TransactionRowsRef = {
	[id: string]: HTMLDivElement | null
}
export type FoldState = {
	[id: string]: boolean
}

export type GroupedTransaction = { date: string; transactions: FetchedTransaction[] }

/**
 * Used to update a specific transaction's `foldState` in a concise way.
 * @param transaction_id
 * @param folded the value to set the `foldState` to. Leave undefined to toggle.
 */
export type FoldStateUpdater = (transaction_id: string, folded?: boolean) => void

export function TransactionManager() {
	const [loaded, setLoaded] = useState<boolean>(false)

	const [defTransactionData, setDefTransactionData] = useState<
		FetchedTransaction[] | null
	>(null)
	const [curTransactionData, setCurTransactionData] = useState<
		FetchedTransaction[] | null
	>(null)
	const [categoryData, setCategoryData] = useState<FetchedCategory[] | null>(null)
	const [accountData, setAccountData] = useState<FetchedAccount[] | null>(null)

	const [defSortOrder, setDefSortOrder] = useState<SortOrder>({})
	const [curSortOrder, setCurSortOrder] = useState<SortOrder>({})
	const [counter, setCounter] = useState(0)

	const [foldState, setFoldState] = useState<FoldState>({})
	/**
	 * `prevFoldStateRef` is used to reference the previous render's fold state during
	 * current render. This allows animations to be played only when foldState changes,
	 * instead of every re-render
	 */
	const prevFoldStateRef = useRef<FoldState>({})
	useEffect(() => {
		prevFoldStateRef.current = foldState
	}, [foldState])

	/**
	 * References the DOM elements of each transaction row. Used for resorting logic.
	 */
	const transactionRowsRef = useRef<TransactionRowsRef>({})
	const setTransactionRowRef = (transaction_id: string) => (node: HTMLInputElement) => {
		transactionRowsRef.current[transaction_id] = node
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
			setLoaded,
			setDefTransactionData,
			setCurTransactionData,
			setFoldState,
			setCategoryData,
			setAccountData,
			setDefSortOrder,
			setCurSortOrder
		)
	}, [])

	const dropdownOptionsCategory: JDropdownTypes.Option[] | null = useMemo(() => {
		if (categoryData === null) {
			return null
		} else {
			const options = categoryData.map((cat) => {
				return {
					name: cat.name,
					value: cat.id,
				}
			})
			options.unshift({ name: 'None', value: 'none' })
			return options
		}
	}, [categoryData])
	const dropdownOptionsAccount: JDropdownTypes.Option[] | null = useMemo(() => {
		if (accountData === null) {
			return null
		} else {
			const options = accountData.map((act) => {
				return {
					name: act.name,
					value: act.id,
				}
			})
			options.unshift({ name: 'None', value: 'none' })
			return options
		}
	}, [accountData])

	const updateItemSortOrder = useCallback(
		(transaction: FetchedTransaction, transactionIndex: number) =>
			(oldItemIndex: number, newItemIndex: number) => {
				setCurSortOrder((prev) => {
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
			setCurSortOrder((prev) => {
				const clone = structuredClone(prev)

				moveItemInArray(clone[date], oldIndex, newIndex)

				return clone
			})
		},
		[]
	)

	const defTransactionsOrganized = useMemo(() => {
		if (defTransactionData !== null) {
			return sortTransactions(curSortOrder, defTransactionData)
		}
		return null
	}, [defTransactionData, curSortOrder])

	const curTransactionsOrganized = useMemo(() => {
		if (curTransactionData !== null) {
			return sortTransactions(curSortOrder, curTransactionData)
		}
		return null
	}, [curTransactionData, curSortOrder])

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

	let grid: ReactNode

	if (
		loaded &&
		defTransactionsOrganized !== null &&
		curTransactionsOrganized !== null &&
		dropdownOptionsCategory !== null &&
		dropdownOptionsAccount !== null
	) {
		if (defTransactionsOrganized.length === 0) {
			grid = (
				<p>
					You do not have any transactions, click "Create new transaction" below to
					get started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = []

			curTransactionsOrganized.forEach((groupedItem, groupedItemIndex) => {
				cells.push(<DateRow date={groupedItem.date} />)

				groupedItem.transactions.forEach((curTransaction, index) => {
					const defTransaction =
						defTransactionsOrganized[groupedItemIndex].transactions[index]
					if (curTransaction.items.length === 1) {
						const props: SingleRowProps = {
							curTransaction,
							defTransaction,
							placeMarginAbove: index !== 0,
							dropdownOptionsCategory,
							dropdownOptionsAccount,
							onResortMouseDown: handleTransactionReorder(
								groupedItem.transactions,
								curTransaction,
								index,
								updateTransactionSortOrder(groupedItem.date),
								transactionRowsRef,
								foldState[curTransaction.id],
								updateFoldState
							),
						}
						cells.push(
							<SingleRow
								{...props}
								ref={setTransactionRowRef(curTransaction.id)}
							/>
						)
					} else {
						const props: MultiRowProps = {
							transaction: curTransaction,
							dropdownOptionsCategory: dropdownOptionsCategory,
							dropdownOptionsAccount: dropdownOptionsAccount,
							onItemReorder: updateItemSortOrder(curTransaction, index),
							folded: foldState[curTransaction.id],
							playAnimation:
								prevFoldStateRef.current[curTransaction.id] === undefined
									? false
									: prevFoldStateRef.current[curTransaction.id] !==
									  foldState[curTransaction.id],
							placeMarginAbove: index !== 0,
							updateFoldState,
							onTransactionReorderMouseDown: handleTransactionReorder(
								groupedItem.transactions,
								curTransaction,
								index,
								updateTransactionSortOrder(groupedItem.date),
								transactionRowsRef,
								foldState[curTransaction.id],
								updateFoldState
							),
						}

						cells.push(
							<MultiRow
								{...props}
								ref={setTransactionRowRef(curTransaction.id)}
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
			TransactionManager
			{!loaded && <div>Loading...</div>}
			<div>{grid}</div>
		</div>
	)
}
