'use client'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import s from './TransactionManager.module.scss'
import {
	areDeeplyEqual,
	createPopup,
	getScrollbarWidth,
	addIsolatedKeyListeners,
	IsolatedKeyListener,
	removeIsolatedKeyListeners,
	setKeyListenerContext,
	promptError,
	isStandardError,
} from '@/utils'
import { FetchedTransaction, FetchedAccount, FetchedCategory } from '@/database'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { fetchAndLoadData, sortTransactions, saveChanges, genHeaders } from './func'
import { DateRow, MultiRowProps, MultiRow, SingleRow, SingleRowProps } from './components'
import { JButton, JNumberAccounting } from '@/components/JForm'
import {
	useHistory,
	FoldState,
	useFoldState,
	usePendingChanges,
	useSortOrder,
	useTabIndexer,
	useGridNav,
} from './hooks'
import { NewTransactionForm } from './components/DateRow/NewTransactionForm/NewTransactionForm'

export function TransactionManager() {
	const mainContainerRef = useRef<HTMLDivElement | null>(null)
	const transactionDataRef = useRef<FormTransaction[] | null>([])
	const prevFoldStateRef = useRef<FoldState>({})
	const transactionRowsRef = useRef<TransactionRowsRef>({})
	const saveChangesButtonRef = useRef<HTMLButtonElement>(null)

	const [loaded, setLoaded] = useState<boolean>(false)
	const [transactionData, setTransactionData] = useState<FormTransaction[] | null>(null)
	const [categoryData, setCategoryData] = useState<FetchedCategory[] | null>(null)
	const [accountData, setAccountData] = useState<FetchedAccount[] | null>(null)
	const [isSaving, setIsSaving] = useState(false)

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

	const foldState = useFoldState()
	const sortOrder = useSortOrder({
		transactionRowsRef,
		getFoldState: foldState.get,
		updateFoldState: foldState.update,
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
	const pendingChanges = usePendingChanges({
		sortOrder,
		afterItemDeletion: (id) =>
			historyController.add({ type: 'item_deletion', item_id: id }),
		afterTransactionDeletion: (id) =>
			historyController.add({ type: 'transaction_deletion', transaction_id: id }),
		afterItemDeletionReversed: (id) =>
			historyController.add({ type: 'item_deletion_reversed', item_id: id }),
		afterTransactionDeletionReversed: (id) =>
			historyController.add({
				type: 'transaction_deletion_reversed',
				transaction_id: id,
			}),
	})
	const historyController = useHistory({
		transactionDataRef,
		sortOrder,
		pendingChanges,
	})

	const handleCreateTransaction = () => {
		let refreshRequired = false
		const setRefreshRequired = () => {
			refreshRequired = true
		}

		const afterPopupClosed = () => {
			if (refreshRequired) {
				refreshData()
			}
		}

		const popup = createPopup(
			<NewTransactionForm
				dropdownOptions={dropdownOptions}
				forceClosePopup={() => {
					popup.close()
					afterPopupClosed()
				}}
				setRefreshRequired={setRefreshRequired}
			/>,
			'normal',
			afterPopupClosed
		)
		popup.trigger()
	}

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

	const refreshData = async () => {
		await fetchAndLoadData(
			setTransactionData,
			foldState.set,
			setCategoryData,
			setAccountData,
			sortOrder.setDefault,
			sortOrder.setCurrent
		)
		pendingChanges.clear()
		historyController.clear()
		return
	}
	useEffect(() => {
		;(async () => {
			setLoaded(false)
			await refreshData()
			setLoaded(true)
		})()
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

	const isChangedRef = useRef<boolean>(false)
	isChangedRef.current =
		pendingChanges.isChanges || !areDeeplyEqual(sortOrder.cur, sortOrder.def)

	const handleDiscardChanges = () => {
		pendingChanges.clear()
		historyController.clear()
	}

	const handleSaveChanges = async () => {
		if (isChangedRef.current) {
			setIsSaving(true)
			pendingChanges.disableChanges()
			sortOrder.disableChanges()
			try {
				await saveChanges(pendingChanges, sortOrder, transactionDataRef)
				await refreshData()
				setIsSaving(false)
				pendingChanges.enableChanges()
				sortOrder.enableChanges()
			} catch (e) {
				if (isStandardError(e)) {
					promptError(
						'Errors occured while saving your data',
						e.message,
						'Try refreshing your browser'
					)
					console.error(e)
				}
				setIsSaving(false)
				pendingChanges.enableChanges()
				sortOrder.enableChanges()
			}
		}
	}

	const dropdownOptions: DropdownOptions = useMemo(() => {
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
					options.unshift({ name: '', value: '' })
					return options
				}
			})(),
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
					options.unshift({ name: '', value: '' })
					return options
				}
			})(),
		}
	}, [categoryData, accountData])

	const sortedData = useMemo(() => {
		if (transactionData !== null) {
			return sortTransactions(sortOrder.cur, transactionData, pendingChanges)
		}
		return null
	}, [transactionData, sortOrder.cur])

	const headers: JGridTypes.Header[] = genHeaders(historyController)

	let grid: ReactNode

	if (loaded && sortedData !== null) {
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
								refreshData={refreshData}
								gridRow={gridRow}
								key={`${groupedItem.date}-${groupedItemIndex}`}
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
						refreshData={refreshData}
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
							sortOrder.def[transaction.date].findIndex(
								(it) => it === transaction.id
							) !== transactionIndex
						const props: SingleRowProps = {
							transaction,
							pendingChanges,
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
								ref={setTransactionRowRef(transaction.id)}
								key={`${groupedItemIndex}-${transaction.id}-${transactionIndex}`}
							/>
						)
						gridNavIndex++
					} else {
						const sortPosChanged =
							sortOrder.def[transaction.date].findIndex(
								(it) => it[0] === transaction.id
							) !== transactionIndex
						const props: MultiRowProps = {
							transaction,
							transactionIndex,
							pendingChanges,
							dropdownOptions,
							folded: foldState.cur[transaction.id],
							playAnimation:
								prevFoldStateRef.current[transaction.id] === undefined
									? false
									: prevFoldStateRef.current[transaction.id] !==
									  foldState.cur[transaction.id],
							updateFoldState: foldState.update,
							transactionSortPosChanged: sortPosChanged,
							defSortOrder: sortOrder.def,
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
								ref={setTransactionRowRef(transaction.id)}
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
			}
			grid = <JGrid className={s.grid} {...gridConfig} />
		}
	}
	return (
		<div
			className={s.main}
			ref={mainContainerRef}
			onClick={makeActiveContext}
			onKeyDown={makeActiveContext}
		>
			{!loaded ? (
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
				<>
					<div className={s.grid_container}>{grid}</div>
					<div className={s.control_container}>
						<JButton
							jstyle='secondary'
							disabled={isChangedRef.current}
							className={s.new_transaction_button}
							onClick={handleCreateTransaction}
							title={
								isChangedRef.current
									? 'Disabled while there are changes to be saved'
									: 'Opens form to create a new transaction'
							}
						>
							Create New Transaction
						</JButton>
						<JButton
							jstyle='primary'
							disabled={!isChangedRef.current}
							className={s.discard_button}
							onClick={handleDiscardChanges}
						>
							Discard Changes
						</JButton>
						<JButton
							jstyle='primary'
							disabled={!isChangedRef.current}
							className={s.save_button}
							loading={isSaving}
							onClick={handleSaveChanges}
							ref={saveChangesButtonRef}
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

export type DropdownOptions = {
	category: JDropdownTypes.Option[]
	account: JDropdownTypes.Option[]
}
