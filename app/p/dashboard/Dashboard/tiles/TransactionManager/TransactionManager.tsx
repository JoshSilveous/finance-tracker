'use client'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import s from './TransactionManager.module.scss'
import {
	areDeeplyEqual,
	addIsolatedKeyListeners,
	IsolatedKeyListener,
	removeIsolatedKeyListeners,
	setKeyListenerContext,
	setNumPref,
	getCurDate,
	parseDateString,
	getCurDateString,
} from '@/utils'
import { FetchedTransaction } from '@/database'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { sortTransactions, genHeaders } from './func'
import { DateRow, MultiRowProps, MultiRow, SingleRow, SingleRowProps } from './components'
import { JButton, JNumberAccounting } from '@/components/JForm'
import { useTabIndexer, useGridNav } from './hooks'
import { FoldState, DashboardController } from '../../hooks'

export interface TransactionManagerProps {
	dashCtrl: DashboardController
}

export function TransactionManager({ dashCtrl }: TransactionManagerProps) {
	const mainContainerRef = useRef<HTMLDivElement>(null)
	const prevFoldStateRef = useRef<FoldState>({})

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
				run: dashCtrl.history.undo,
				preventDefault: true,
			},
			{
				context: 'TransactionManager',
				char: 'Z',
				ctrlKey: true,
				shiftKey: true,
				run: dashCtrl.history.redo,
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
		]

		addIsolatedKeyListeners(listeners)
		makeActiveContext()

		return () => {
			removeIsolatedKeyListeners(listeners)
		}
	}, [])

	const tabIndexer = useTabIndexer(0)

	useEffect(() => {
		/**
		 * `prevFoldStateRef` is used to reference the previous render's fold state during
		 * current render. This allows animations to be played only when foldState changes,
		 * instead of every re-render
		 */
		prevFoldStateRef.current = dashCtrl.foldState.cur
	}, [dashCtrl.foldState.cur])

	const isChangedRef = useRef<boolean>(false)
	isChangedRef.current =
		dashCtrl.data.isPendingSave ||
		!areDeeplyEqual(dashCtrl.sortOrder.cur, dashCtrl.sortOrder.def)

	const dropdownOptions: DropdownOptions = {
		category: (() => {
			const options = dashCtrl.data.cur.categories.map((cat) => {
				return {
					name: cat.name,
					value: cat.id,
				}
			})
			options.unshift({ name: '', value: '' })
			return options
		})(),
		account: (() => {
			const options = dashCtrl.data.cur.accounts.map((act) => {
				return {
					name: act.name,
					value: act.id,
				}
			})
			options.unshift({ name: '', value: '' })
			return options
		})(),
	}

	const sortedData = useMemo(() => {
		return sortTransactions(dashCtrl.sortOrder.cur, dashCtrl.data.cur.transactions)
	}, [dashCtrl.data.cur.transactions, dashCtrl.sortOrder.cur])

	const headers: JGridTypes.Header[] = genHeaders(dashCtrl.history)

	let grid: ReactNode

	if (sortedData.length !== 0) {
		const cells: JGridTypes.Props['cells'] = []

		let gridRow = 2
		let gridNavIndex = 0

		sortedData.forEach((groupedItem, groupedItemIndex) => {
			if (groupedItemIndex === 0) {
				const inputDate = parseDateString(groupedItem.date)
				if (inputDate < getCurDate()) {
					cells.push(
						<DateRow
							data={dashCtrl.data}
							date={getCurDateString()}
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
					data={dashCtrl.data}
					date={groupedItem.date}
					gridRow={gridRow}
					key={`${groupedItem.date}-${groupedItemIndex}`}
					tabIndexer={tabIndexer}
					gridNavIndex={gridNavIndex}
				/>
			)
			gridRow++
			gridNavIndex++

			groupedItem.transactions.forEach((transaction, transactionIndex) => {
				const sortPosChanged = dashCtrl.sortOrder.def[transaction.date.orig]
					? dashCtrl.sortOrder.def[transaction.date.orig].findIndex(
							(it) => it[0] === transaction.id
					  ) !== transactionIndex
					: true

				if (transaction.items.length === 1) {
					const props: SingleRowProps = {
						transaction,
						transactionIndex,
						dashCtrl,
						dropdownOptions,
						sortPosChanged,
						disableTransactionResort: groupedItem.transactions.length === 1,
						gridRow,
						tabIndexer,
						gridNavIndex,
					}
					cells.push(
						<SingleRow
							{...props}
							key={`${groupedItemIndex}-${transaction.id}-${transactionIndex}`}
						/>
					)
					gridNavIndex++
				} else {
					const props: MultiRowProps = {
						transaction,
						dashCtrl,
						transactionIndex,
						dropdownOptions,
						folded: dashCtrl.foldState.cur[transaction.id],
						playAnimation:
							prevFoldStateRef.current[transaction.id] === undefined
								? false
								: prevFoldStateRef.current[transaction.id] !==
								  dashCtrl.foldState.cur[transaction.id],
						transactionSortPosChanged: sortPosChanged,
						disableTransactionResort: groupedItem.transactions.length === 1,
						gridRow,
						tabIndexer,
						gridNavIndex,
					}

					cells.push(
						<MultiRow
							{...props}
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
			onResize: (e) => {
				const newWidth = Math.round(e.newWidth)
				switch (e.columnIndex) {
					case 1: {
						setNumPref('TransactionManager_Date_Col', newWidth)
						break
					}
					case 2: {
						setNumPref('TransactionManager_Name_Col', newWidth)
						break
					}
					case 3: {
						setNumPref('TransactionManager_Amount_Col', newWidth)
						break
					}
					case 4: {
						setNumPref('TransactionManager_Category_Col', newWidth)
						break
					}
					case 5: {
						setNumPref('TransactionManager_Account_Col', newWidth)
						break
					}
				}
			},
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
			{dashCtrl.data.isLoading ? (
				<div className={s.loading_container}>Loading...</div>
			) : sortedData!.length === 0 ? (
				<div className={s.no_transactions_container}>
					<div>
						You do not have any transactions, click &quot;Create new
						transaction&quot; below to get started!
					</div>
					<JButton jstyle='primary' onClick={() => {}}>
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
