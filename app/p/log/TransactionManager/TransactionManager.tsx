'use client'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import s from './TransactionManager.module.scss'
import {
	areDeeplyEqual,
	createPopup,
	addIsolatedKeyListeners,
	IsolatedKeyListener,
	removeIsolatedKeyListeners,
	setKeyListenerContext,
} from '@/utils'
import { FetchedTransaction } from '@/database'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { sortTransactions, genHeaders } from './func'
import { DateRow, MultiRowProps, MultiRow, SingleRow, SingleRowProps } from './components'
import { JButton, JNumberAccounting } from '@/components/JForm'
import { useTabIndexer, useGridNav } from './hooks'
import { NewTransactionForm } from './components/DateRow/NewTransactionForm/NewTransactionForm'
import {
	Data,
	FoldState,
	FoldStateController,
	HistoryController,
	SortOrder,
} from '../Dashboard/hooks'

export interface TransactionManagerProps {
	data: Data.Controller
	sortOrder: SortOrder.Controller
	foldState: FoldStateController
	historyController: HistoryController
	setTransactionManagerRowRef: (transaction_id: string) => (node: HTMLInputElement) => void
}

export function TransactionManager({
	data,
	sortOrder,
	foldState,
	historyController,
	setTransactionManagerRowRef,
}: TransactionManagerProps) {
	const mainContainerRef = useRef<HTMLDivElement>(null)
	const prevFoldStateRef = useRef<FoldState>({})
	const saveChangesButtonRef = useRef<HTMLButtonElement>(null)

	const gridNav = useGridNav(
		[
			'TM_left_controls',
			'TM_date',
			'TM_name',
			'TM_amount',
			'TM_category',
			'TM_account',
			'TM_right_controls',
		],
		{ loopAtEnd: true }
	)

	const makeActiveContext = () => setKeyListenerContext('TransactionManager')
	useEffect(() => {
		// set up key listeners

		const listeners: IsolatedKeyListener[] = [
			{
				context: 'TransactionManager',
				char: 'Z',
				ctrlKey: true,
				shiftKey: false,
				run: historyController.undo,
				preventDefault: true,
			},
			{
				context: 'TransactionManager',
				char: 'Z',
				ctrlKey: true,
				shiftKey: true,
				run: historyController.redo,
				preventDefault: true,
			},
			{
				context: 'TransactionManager',
				char: 'ENTER',
				ctrlKey: false,
				shiftKey: false,
				run: (e) => {
					if (gridNav.moveDown()) {
						e.preventDefault()
					}
				},
			},
			{
				context: 'TransactionManager',
				char: 'ENTER',
				ctrlKey: false,
				shiftKey: true,
				run: (e) => {
					if (gridNav.moveUp()) {
						e.preventDefault()
					}
				},
			},
			{
				context: 'TransactionManager',
				char: 'S',
				ctrlKey: true,
				shiftKey: false,
				run: () => {
					const saveButton = saveChangesButtonRef.current! as HTMLButtonElement

					const clickEvent = new Event('click', {
						bubbles: true,
						cancelable: true,
					})

					saveButton.dispatchEvent(clickEvent)
				},
				preventDefault: true,
			},
		]

		addIsolatedKeyListeners(listeners)
		makeActiveContext()

		return () => {
			removeIsolatedKeyListeners(listeners)
		}
	}, [])

	const tabIndexer = useTabIndexer(0)

	const handleCreateTransaction = () => {
		// let refreshRequired = false
		// const setRefreshRequired = () => {
		// 	refreshRequired = true
		// }
		// const afterPopupClosed = () => {
		// 	if (refreshRequired) {
		// 		refreshData()
		// 	}
		// }
		// const popup = createPopup(
		// 	<NewTransactionForm
		// 		dropdownOptions={dropdownOptions}
		// 		forceClosePopup={() => {
		// 			popup.close()
		// 			afterPopupClosed()
		// 		}}
		// 		setRefreshRequired={setRefreshRequired}
		// 	/>,
		// 	'normal',
		// 	afterPopupClosed
		// )
		// popup.trigger()
	}

	useEffect(() => {
		/**
		 * `prevFoldStateRef` is used to reference the previous render's fold state during
		 * current render. This allows animations to be played only when foldState changes,
		 * instead of every re-render
		 */
		prevFoldStateRef.current = foldState.cur
	}, [foldState.cur])

	const isChangedRef = useRef<boolean>(false)
	isChangedRef.current =
		data.isPendingSave || !areDeeplyEqual(sortOrder.cur, sortOrder.def)

	const handleDiscardChanges = () => {
		data.clearChanges()
		historyController.clear()
	}

	const dropdownOptions: DropdownOptions = {
		category: (() => {
			const options = data.cur.categories.map((cat) => {
				return {
					name: cat.name.val,
					value: cat.id,
				}
			})
			options.unshift({ name: '', value: '' })
			return options
		})(),
		account: (() => {
			const options = data.cur.accounts.map((act) => {
				return {
					name: act.name.val,
					value: act.id,
				}
			})
			options.unshift({ name: '', value: '' })
			return options
		})(),
	}

	const sortedData = useMemo(() => {
		return sortTransactions(sortOrder.cur, data.cur.transactions)
	}, [data.cur.transactions, sortOrder.cur])

	const headers: JGridTypes.Header[] = genHeaders(historyController)

	let grid: ReactNode

	if (sortedData.length !== 0) {
		const cells: JGridTypes.Props['cells'] = []

		let gridRow = 2
		let gridNavIndex = 0
		sortedData.forEach((groupedItem, groupedItemIndex) => {
			if (groupedItemIndex === 0) {
				const today = new Date()
				today.setHours(0, 0, 0, 0)
				const inputDate = new Date(`${groupedItem.date}T00:00:00`)
				if (inputDate < today) {
					cells.push(
						<DateRow
							date={today.toISOString().split('T')[0]}
							dropdownOptions={dropdownOptions}
							refreshData={data.reload}
							gridRow={gridRow}
							key={`${groupedItem.date}-TODAY`}
							tabIndexer={tabIndexer}
							gridNavIndex={gridNavIndex}
						/>
					)
					gridRow++
					gridNavIndex++
				}
			}
			cells.push(
				<DateRow
					date={groupedItem.date}
					dropdownOptions={dropdownOptions}
					refreshData={data.reload}
					gridRow={gridRow}
					key={`${groupedItem.date}-${groupedItemIndex}`}
					tabIndexer={tabIndexer}
					gridNavIndex={gridNavIndex}
				/>
			)
			gridRow++
			gridNavIndex++

			groupedItem.transactions.forEach((transaction, transactionIndex) => {
				if (transaction.items.length === 1) {
					const sortPosChanged =
						sortOrder.def[transaction.date.val].findIndex(
							(it) => it === transaction.id
						) !== transactionIndex
					const props: SingleRowProps = {
						transaction,
						data,
						dropdownOptions,
						sortPosChanged,
						disableTransactionResort: groupedItem.transactions.length === 1,
						historyController,
						sortOrder,
						gridRow,
						tabIndexer,
						gridNavIndex,
					}
					cells.push(
						<SingleRow
							{...props}
							ref={setTransactionManagerRowRef(transaction.id)}
							key={`${groupedItemIndex}-${transaction.id}-${transactionIndex}`}
						/>
					)
					gridNavIndex++
				} else {
					const sortPosChanged =
						sortOrder.def[transaction.date.val].findIndex(
							(it) => it[0] === transaction.id
						) !== transactionIndex
					const props: MultiRowProps = {
						transaction,
						data,
						transactionIndex,
						dropdownOptions,
						folded: foldState.cur[transaction.id],
						playAnimation:
							prevFoldStateRef.current[transaction.id] === undefined
								? false
								: prevFoldStateRef.current[transaction.id] !==
								  foldState.cur[transaction.id],
						updateFoldState: foldState.update,
						transactionSortPosChanged: sortPosChanged,
						disableTransactionResort: groupedItem.transactions.length === 1,
						historyController,
						sortOrder,
						gridRow,
						tabIndexer,
						gridNavIndex,
					}

					cells.push(
						<MultiRow
							{...props}
							ref={setTransactionManagerRowRef(transaction.id)}
							key={`${groupedItemIndex}-${transaction.id}-${transactionIndex}`}
						/>
					)
					gridNavIndex += transaction.items.length + 1
				}
				gridRow++
			})
		})
		gridNav.setEndIndex(gridNavIndex)
		const gridConfig: JGridTypes.Props = {
			headers: headers,
			cells: cells,
			noBorders: true,
			maxTableWidth: 1000,
			stickyHeaders: true,
			useFullWidth: true,
		}
		grid = <JGrid className={s.grid} {...gridConfig} />
	}
	return (
		<div
			className={s.main}
			ref={mainContainerRef}
			onClick={makeActiveContext}
			onKeyDown={makeActiveContext}
		>
			{data.isLoading ? (
				<div className={s.loading_container}>Loading...</div>
			) : sortedData!.length === 0 ? (
				<div>
					<div>
						You do not have any transactions, click "Create new transaction"
						below to get started!
					</div>
					<JButton
						jstyle='primary'
						onClick={() => {
							const popup = createPopup(
								<NewTransactionForm
									dropdownOptions={dropdownOptions}
									defaultDate={new Date().toISOString().split('T')[0]}
									forceClosePopup={() => popup.close()}
								/>
							)
							popup.trigger()
						}}
					>
						Create new transaction
					</JButton>
				</div>
			) : (
				<div className={s.grid_container}>{grid}</div>
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
// export interface FormTransaction extends Omit<FetchedTransaction, 'items'> {
// 	items: (Omit<FetchedTransaction['items'][number], 'amount'> & { amount: string })[]
// }

export type DropdownOptions = {
	category: JDropdownTypes.Option[]
	account: JDropdownTypes.Option[]
}
