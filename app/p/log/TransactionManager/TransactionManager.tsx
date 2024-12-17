'use client'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import s from './TransactionManager.module.scss'
import { areDeeplyEqual, getScrollbarWidth } from '@/utils'
import { FetchedTransaction, FetchedAccount, FetchedCategory } from '@/database'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { handleTransactionReorder, fetchAndLoadData, sortTransactions } from './func'
import { DateRow, MultiRowProps, MultiRow, SingleRow, SingleRowProps } from './components'
import { default as UndoRedoIcon } from '@/public/undo_redo.svg'
import { JButton, JNumberAccounting } from '@/components/JForm'
import {
	useHistory,
	FoldState,
	useFoldState,
	usePendingChanges,
	useSortOrder,
	useKeyListener,
} from './hooks'

export function TransactionManager() {
	const mainContainerRef = useRef<HTMLDivElement | null>(null)
	const transactionDataRef = useRef<FormTransaction[] | null>([])
	const prevFoldStateRef = useRef<FoldState>({})
	const transactionRowsRef = useRef<TransactionRowsRef>({})

	const [loaded, setLoaded] = useState<boolean>(false)
	const [transactionData, setTransactionData] = useState<FormTransaction[] | null>(null)
	const [categoryData, setCategoryData] = useState<FetchedCategory[] | null>(null)
	const [accountData, setAccountData] = useState<FetchedAccount[] | null>(null)

	const foldState = useFoldState()
	const pendingChanges = usePendingChanges()
	const sortOrder = useSortOrder({
		afterTransactionPositionChange: (date, oldIndex, newIndex) => {
			historyController.add({
				type: 'transaction_position_change',
				date: date,
				oldIndex: oldIndex,
				newIndex: newIndex,
			})
		},
		afterItemPositionChange: (transaction, oldItemIndex, newItemIndex) => {
			historyController.add({
				type: 'item_position_change',
				transaction_id: transaction.id,
				date: transaction.date,
				oldIndex: oldItemIndex,
				newIndex: newItemIndex,
			})
		},
	})
	const historyController = useHistory({
		transactionDataRef,
		setCurSortOrder: sortOrder.setCurrent,
		updatePendingChanges: pendingChanges.update,
	})

	useKeyListener({
		listeners: [
			{
				char: 'Z',
				ctrlKey: true,
				run: () => {
					console.log('RUNN')
				},
			},
			{
				char: 'Z',
				ctrlKey: true,
				shiftKey: true,
				run: () => {
					console.log('RUNN 2')
				},
			},
		],
	})

	useEffect(() => {
		transactionDataRef.current = transactionData
	}, [transactionData])

	useEffect(() => {
		/**
		 * Sets the `--scrollbar-width` css variable, used for smooth scrollbar animations across any browser
		 */
		if (mainContainerRef.current !== null) {
			mainContainerRef.current.style.setProperty(
				'--scrollbar-width',
				getScrollbarWidth() + 'px'
			)
		}
	}, [mainContainerRef, loaded])

	useEffect(() => {
		fetchAndLoadData(
			setLoaded,
			setTransactionData,
			foldState.set,
			setCategoryData,
			setAccountData,
			sortOrder.setDefault,
			sortOrder.setCurrent
		)
	}, [])

	useEffect(() => {
		/**
		 * `prevFoldStateRef` is used to reference the previous render's fold state during
		 * current render. This allows animations to be played only when foldState changes,
		 * instead of every re-render
		 */
		prevFoldStateRef.current = foldState.cur
	}, [foldState.cur])

	const setTransactionRowRef = (transaction_id: string) => (node: HTMLInputElement) => {
		/**
		 * References the DOM elements of each transaction row. Used for resorting logic.
		 */
		transactionRowsRef.current[transaction_id] = node
	}

	const dropdownOptions = useMemo(() => {
		return {
			category: (() => {
				if (categoryData === null) {
					return []
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
			})() as JDropdownTypes.Option[],
			account: (() => {
				if (accountData === null) {
					return []
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
			})() as JDropdownTypes.Option[],
		}
	}, [categoryData, accountData])

	const sortedData = useMemo(() => {
		if (transactionData !== null) {
			return sortTransactions(sortOrder.cur, transactionData)
		}
		return null
	}, [transactionData, sortOrder.cur])

	const isChanged = useMemo(() => {
		if (Object.keys(pendingChanges.cur.transactions).length !== 0) {
			return true
		}
		if (Object.keys(pendingChanges.cur.items).length !== 0) {
			return true
		}
		if (!areDeeplyEqual(sortOrder.cur, sortOrder.def)) {
			return true
		}
		return false
	}, [pendingChanges.cur, sortOrder.cur, sortOrder.def])

	const headers: JGridTypes.Header[] = useMemo(() => {
		console.log('re-running memo')
		return [
			{
				content: (
					<div className={`${s.header_container} ${s.control}`}>
						<button
							className={s.undo}
							onClick={historyController.undo}
							disabled={historyController.undoDisabled}
							title='Undo most recent change'
						>
							<UndoRedoIcon />
						</button>
						<button
							className={s.redo}
							onClick={historyController.redo}
							disabled={historyController.redoDisabled}
							title='Redo most recent change'
						>
							<UndoRedoIcon />
						</button>
					</div>
				),
				defaultWidth: 75,
				noResize: true,
			},
			{
				content: (
					<div className={`${s.header_container} ${s.first}`}>
						<div className={s.text}>Date</div>
					</div>
				),
				defaultWidth: 140,
				minWidth: 105,
				maxWidth: 150,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.text}>Name</div>
					</div>
				),
				defaultWidth: 260,
				minWidth: 160,
				maxWidth: 300,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.text}>Amount</div>
					</div>
				),
				defaultWidth: 140,
				minWidth: 95,
				maxWidth: 160,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.text}>Category</div>
					</div>
				),
				defaultWidth: 170,
				minWidth: 110,
				maxWidth: 200,
			},
			{
				content: (
					<div className={`${s.header_container} ${s.last}`}>
						<div className={s.text}>Account</div>
					</div>
				),
				defaultWidth: 170,
				minWidth: 110,
				maxWidth: 200,
			},
		]
	}, [historyController.undoDisabled, historyController.redoDisabled])

	let grid: ReactNode

	if (loaded && sortedData !== null) {
		if (sortedData.length === 0) {
			grid = (
				<p>
					You do not have any transactions, click "Create new transaction" below to
					get started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = []

			sortedData.forEach((groupedItem, groupedItemIndex) => {
				cells.push(<DateRow date={groupedItem.date} />)

				groupedItem.transactions.forEach((transaction, index) => {
					if (transaction.items.length === 1) {
						const sortPosChanged =
							sortOrder.def[transaction.date].findIndex(
								(it) => it === transaction.id
							) !== index
						const props: SingleRowProps = {
							transaction,
							pendingChanges: pendingChanges.cur,
							updatePendingChanges: pendingChanges.update,
							dropdownOptions,
							onResortMouseDown: handleTransactionReorder(
								groupedItem.transactions,
								transaction,
								index,
								sortOrder.updateTransaction(groupedItem.date),
								transactionRowsRef,
								foldState.cur[transaction.id],
								foldState.update
							),
							sortPosChanged,
							disableTransactionResort: groupedItem.transactions.length === 1,
							historyController,
						}
						cells.push(
							<SingleRow
								{...props}
								ref={setTransactionRowRef(transaction.id)}
							/>
						)
					} else {
						const sortPosChanged =
							sortOrder.def[transaction.date].findIndex(
								(it) => it[0] === transaction.id
							) !== index
						const props: MultiRowProps = {
							transaction,
							pendingChanges: pendingChanges.cur,
							updatePendingChanges: pendingChanges.update,
							dropdownOptions,
							onItemReorder: sortOrder.updateItem(transaction, index),
							folded: foldState.cur[transaction.id],
							playAnimation:
								prevFoldStateRef.current[transaction.id] === undefined
									? false
									: prevFoldStateRef.current[transaction.id] !==
									  foldState.cur[transaction.id],
							updateFoldState: foldState.update,
							onTransactionReorderMouseDown: handleTransactionReorder(
								groupedItem.transactions,
								transaction,
								index,
								sortOrder.updateTransaction(groupedItem.date),
								transactionRowsRef,
								foldState.cur[transaction.id],
								foldState.update
							),
							transactionSortPosChanged: sortPosChanged,
							defSortOrder: sortOrder.def,
							disableTransactionResort: groupedItem.transactions.length === 1,
							historyController,
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
				stickyHeaders: true,
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
					<div className={s.control_container}>
						<JButton
							jstyle='primary'
							disabled={!isChanged}
							className={s.discard_button}
						>
							Discard Changes
						</JButton>
						<JButton
							jstyle='primary'
							disabled={!isChanged}
							className={s.save_button}
						>
							Save Changes
						</JButton>
					</div>
				</>
			)}
		</div>
	)
}

/**
 * References the parent row HTML elements of each transaction
 */
export type TransactionRowsRef = {
	[id: string]: HTMLDivElement | null
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
