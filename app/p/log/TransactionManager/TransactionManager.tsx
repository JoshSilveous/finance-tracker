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
import { useScrollbarWidth } from '@/utils/useScrollbarWidth'

export function TransactionManager() {
	const [loaded, setLoaded] = useState<boolean>(false)
	const [transactionData, setTransactionData] = useState<FormTransaction[] | null>(null)
	const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
		transactions: {},
		items: {},
	})
	const [categoryData, setCategoryData] = useState<FetchedCategory[] | null>(null)
	const [accountData, setAccountData] = useState<FetchedAccount[] | null>(null)
	const [defSortOrder, setDefSortOrder] = useState<SortOrder>({})
	const [curSortOrder, setCurSortOrder] = useState<SortOrder>({})
	const [foldState, setFoldState] = useState<FoldState>({})

	const mainContainerRef = useRef<HTMLDivElement | null>(null)

	/**
	 * Sets the `--scrollbar-width` css variable, used for smooth scrollbar animations across any browser
	 */
	useEffect(() => {
		if (mainContainerRef.current !== null) {
			console.log('SETTING WIDTH')
			mainContainerRef.current.style.setProperty(
				'--scrollbar-width',
				useScrollbarWidth() + 'px'
			)
		}
	}, [mainContainerRef, loaded])

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

	/**
	 * see {@link PendingChangeUpdater `PendingChangeUpdater`} for usage
	 */
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

	const updateFoldState: FoldStateUpdater = useCallback((transaction_id, folded) => {
		setFoldState((prev) => {
			const newState = structuredClone(prev)
			newState[transaction_id] =
				folded !== undefined ? folded : !newState[transaction_id]
			return newState
		})
	}, [])

	/**
	 * Updated the sort order of an item within a transaction
	 * @param transaction
	 */
	const updateItemSortOrder = useCallback(
		(transaction: FormTransaction, transactionIndex: number) =>
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

	const dataOrganized = useMemo(() => {
		if (transactionData !== null) {
			return sortTransactions(curSortOrder, transactionData)
		}
		return null
	}, [transactionData, curSortOrder])

	const headers: JGridTypes.Header[] = useMemo(() => {
		return [
			{
				content: <></>,
				defaultWidth: 75,
				noResize: true,
			},
			{
				content: <div className={`${s.header_container} ${s.first}`}>Date</div>,
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
				content: <div className={`${s.header_container} ${s.last}`}>Account</div>,
				defaultWidth: 170,
				minWidth: 110,
				maxWidth: 200,
			},
		]
	}, [])

	let grid: ReactNode

	if (
		loaded &&
		dataOrganized !== null &&
		dropdownOptionsCategory !== null &&
		dropdownOptionsAccount !== null
	) {
		if (dataOrganized.length === 0) {
			grid = (
				<p>
					You do not have any transactions, click "Create new transaction" below to
					get started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = []

			dataOrganized.forEach((groupedItem, groupedItemIndex) => {
				cells.push(<DateRow date={groupedItem.date} />)

				groupedItem.transactions.forEach((transaction, index) => {
					if (transaction.items.length === 1) {
						const sortPosChanged =
							defSortOrder[transaction.date].findIndex(
								(it) => it === transaction.id
							) !== index
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
							sortPosChanged,
							disableTransactionResort: groupedItem.transactions.length === 1,
						}
						cells.push(
							<SingleRow
								{...props}
								ref={setTransactionRowRef(transaction.id)}
							/>
						)
					} else {
						const sortPosChanged =
							defSortOrder[transaction.date].findIndex(
								(it) => it[0] === transaction.id
							) !== index
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
							transactionSortPosChanged: sortPosChanged,
							defSortOrder,
							disableTransactionResort: groupedItem.transactions.length === 1,
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
		<div className={s.main} ref={mainContainerRef}>
			{!loaded ? (
				<div className={s.loading_container}>Loading...</div>
			) : (
				<>
					<div className={s.grid_container}>{grid}</div>
					<div className={s.control_container}>test</div>
				</>
			)}
		</div>
	)
}
/**
 * Can either be a string (representing the transaction_id of a single-item) or an array of string (with the first item representing the transaction_id of a multi-item, and the following items representing the item_ids)
 *
 * @example ```ts
 * const sortItems: SortOrderItem[] = ['single_1', 'single_2', ['multi_1', 'item_1', 'item_2', ...], 'single_3', ...]
 * ```
 */
export type SortOrderItem = string | string[]

/**
 * An object that keeps the sort order, keyed by `date`.
 *
 * @example
 * ```ts
 * const sortOrder: SortOrder = {
 *     "2024-12-03": ['transaction_1', 'transaction_2'],
 *     "2024-12-02": [['transaction_3', 'item_1', 'item_2'], 'transaction_4']
 * }
 * ```
 *
 */
export type SortOrder = {
	[date: string]: SortOrderItem[]
}

/**
 * References the parent row HTML elements of each transaction
 */
export type TransactionRowsRef = {
	[id: string]: HTMLDivElement | null
}

/**
 * Keeps track of multi-rows and whether or not they are folded.
 *
 * @example
 * ```ts
 * const foldState: FoldState = {
 *     "transaction_1": false,
 *     "transaction_2": true
 * }
 * ```
 */
export type FoldState = {
	[id: string]: boolean
}

/**
 * Form-friendly version of {@link FetchedTransaction `FetchedTransaction`}
 *
 * _`items.amount` is now a string instead of number_
 *
 * This change is needed for the {@link JNumberAccounting `<JNumberAccounting />`} component to function correctly
 *
 * Structure:
 * ```ts
 * interface FormTransaction {
 *     id: string
 *     date: string
 *     name: string
 *     order_position: number
 *     items: {
 *         id: string
 *         account_id: string | null
 *         category_id: string | null
 *         name: string
 *         amount: string
 *         order_position: number
 *     }[]
 * }
 * ```
 */
export interface FormTransaction extends Omit<FetchedTransaction, 'items'> {
	items: (Omit<FetchedTransaction['items'][number], 'amount'> & { amount: string })[]
}

/**
 * Transaction(s), grouped by date
 */
export type GroupedTransaction = { date: string; transactions: FormTransaction[] }

/**
 * Used to update a specific transaction's `foldState` in a concise way.
 * @param transaction_id
 * @param folded the value to set the `foldState` to. Leave undefined to toggle.
 */
export type FoldStateUpdater = (transaction_id: string, folded?: boolean) => void

/**
 * An object that stores any pending changes the user made to the Transaction data. Keys for the `transactions` and `items` properties are added/removed dynamically using a {@link PendingChangeUpdater `PendingChangeUpdater`}.
 *
 * @example
 * ```ts
 * pendingChanges = {
 *     transactions: {
 *         "transaction_1": {
 *             "name": "New Name",
 *             "date": "2024-12-03"
 *         }
 *     },
 *     items: {}
 * }
 * ```
 */
export type PendingChanges = {
	transactions: {
		[id: string]: Partial<Omit<FormTransaction, 'id' | 'items' | 'order_position'>>
	}
	items: {
		[id: string]: Partial<
			Omit<FormTransaction['items'][number], 'id' | 'order_position'>
		>
	}
}

/**
 * Simplifies updating the `pendingChanges` array. Automatically adds/removes changes to keep pendingChanges minimized to relevant information.
 *
 * @param type `'transactions' | 'items'`
 * @param id The `item` or `transaction` id.
 * @param key The key of the item or transaction you're modifying.
 * @param value optional, leaving undefined will delete the value from `pendingChanges`
 *
 * @example
 * ```ts
 * updatePendingChanges('transactions', transaction.id, 'name', 'Burger') // creates/updates "name" for specified transaction as needed
 * updatePendingChanges('items', item.id, 'name') // removes "name" for specified item (implying the user has undone their change)
 * ```
 */
export type PendingChangeUpdater = <T extends keyof PendingChanges>(
	type: T,
	id: string,
	key: keyof PendingChanges[T][number],
	value?: string
) => void
