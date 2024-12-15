'use client'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import s from './TransactionManager.module.scss'
import { moveItemInArray } from '@/utils'
import { FetchedTransaction, FetchedAccount, FetchedCategory } from '@/database'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { handleTransactionReorder } from './func/handleTransactionReorder'
import { fetchAndLoadData } from './func/fetchAndLoadData'
import { MultiRow, MultiRowProps } from './MultiRow/MultiRow'
import { SingleRow, SingleRowProps } from './SingleRow/SingleRow'
import { DateRow } from './DateRow/DateRow'
import { sortTransactions } from './func/organizeTransactions'
import { JNumberAccounting } from '@/components/JForm'

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

/**
 * {@link FetchedTransaction `FetchedTransaction`}, but `items.amount` is a `string` instead of `number`.
 *
 * This change is needed for the {@link JNumberAccounting `<JNumberAccounting />`} component to function correctly
 */
export interface StateTransaction extends Omit<FetchedTransaction, 'items'> {
	items: (Omit<FetchedTransaction['items'][number], 'amount'> & { amount: string })[]
}

export type GroupedTransaction = { date: string; transactions: StateTransaction[] }

/**
 * Used to update a specific transaction's `foldState` in a concise way.
 * @param transaction_id
 * @param folded the value to set the `foldState` to. Leave undefined to toggle.
 */
export type FoldStateUpdater = (transaction_id: string, folded?: boolean) => void

export type PendingChanges = {
	transactions: {
		[id: string]: Partial<Omit<StateTransaction, 'id' | 'items' | 'order_position'>>
	}
	items: {
		[id: string]: Partial<
			Omit<StateTransaction['items'][number], 'id' | 'order_position'>
		>
	}
}

/**
 * Simplifies updating the `pendingChanges` array.
 * @param type `'transactions' | 'items'`
 * @param id The `item` or `transaction` id.
 * @param key The key of the item or transaction you're modifying.
 * @param value optional, leaving undefined will delete the value from `pendingChanges`
 */
export type PendingChangeUpdater = <T extends keyof PendingChanges>(
	type: T,
	id: string,
	key: keyof PendingChanges[T][number],
	value?: string
) => void

export function TransactionManager() {
	const [loaded, setLoaded] = useState<boolean>(false)
	const [transactionData, setTransactionData] = useState<StateTransaction[] | null>(null)
	const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
		transactions: {},
		items: {},
	})
	const [categoryData, setCategoryData] = useState<FetchedCategory[] | null>(null)
	const [accountData, setAccountData] = useState<FetchedAccount[] | null>(null)
	const [defSortOrder, setDefSortOrder] = useState<SortOrder>({})
	const [curSortOrder, setCurSortOrder] = useState<SortOrder>({})
	const [counter, setCounter] = useState(0)
	const [foldState, setFoldState] = useState<FoldState>({})

	useEffect(() => {
		fetchAndLoadData(
			setLoaded,
			setTransactionData,
			setFoldState,
			setCategoryData,
			setAccountData,
			setDefSortOrder,
			setCurSortOrder
		)
	}, [])

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

	const updatePendingChanges: PendingChangeUpdater = useCallback(
		<T extends keyof PendingChanges>(
			type: T,
			id: string,
			key: keyof PendingChanges[T][number],
			value?: string
		) => {
			setPendingChanges((prev) => {
				const clone = structuredClone(prev)
				const target = clone[type] as Record<
					string,
					Partial<PendingChanges[T][number]>
				>

				if (value !== undefined) {
					target[id] ||= {}
					target[id][key] = value as PendingChanges[T][number][typeof key]
				} else if (target[id] !== undefined) {
					delete target[id][key]
					if (Object.keys(target[id]).length === 0) {
						delete target[id]
					}
				} else {
					delete target[id]
				}

				return clone
			})
		},
		[]
	)

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

	const updateItemSortOrder = useCallback(
		(transaction: StateTransaction, transactionIndex: number) =>
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

	const transactionsOrganized = useMemo(() => {
		if (transactionData !== null) {
			return sortTransactions(curSortOrder, transactionData)
		}
		return null
	}, [transactionData, curSortOrder])

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
		transactionsOrganized !== null &&
		dropdownOptionsCategory !== null &&
		dropdownOptionsAccount !== null
	) {
		if (transactionsOrganized.length === 0) {
			grid = (
				<p>
					You do not have any transactions, click "Create new transaction" below to
					get started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = []

			transactionsOrganized.forEach((groupedItem, groupedItemIndex) => {
				cells.push(<DateRow date={groupedItem.date} />)

				groupedItem.transactions.forEach((transaction, index) => {
					if (transaction.items.length === 1) {
						const props: SingleRowProps = {
							transaction,
							pendingChanges,
							updatePendingChanges,
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
							transaction,
							pendingChanges,
							updatePendingChanges,
							dropdownOptionsCategory: dropdownOptionsCategory,
							dropdownOptionsAccount: dropdownOptionsAccount,
							onItemReorder: updateItemSortOrder(transaction, index),
							folded: foldState[transaction.id],
							playAnimation:
								prevFoldStateRef.current[transaction.id] === undefined
									? false
									: prevFoldStateRef.current[transaction.id] !==
									  foldState[transaction.id],
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
			TransactionManager
			{!loaded && <div>Loading...</div>}
			<div>{grid}</div>
		</div>
	)
}
