import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import {
	useMemo,
	useRef,
	forwardRef,
	useEffect,
	useCallback,
	ChangeEventHandler,
	FocusEventHandler,
} from 'react'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as OptionsIcon } from '@/public/options-vertical.svg'
import { default as InsertRowIcon } from '@/public/insert_row.svg'
import { FormTransaction } from '../../TransactionManager'
import s from './MultiRow.module.scss'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { genLiveVals, LiveVals } from './genLiveVals'
import { PendingChanges } from '../../hooks/usePendingChanges'
import { SortOrder, FoldStateUpdater, HistoryController } from '../../hooks'
import { foldRenderer } from './func/foldRenderer'
import { OptionsMenu } from '../OptionsMenu/OptionsMenu'

export interface MultiRowProps {
	transaction: FormTransaction
	transactionIndex: number
	pendingChanges: PendingChanges.Controller
	dropdownOptions: { category: JDropdownTypes.Option[]; account: JDropdownTypes.Option[] }
	folded: boolean
	playAnimation: boolean
	updateFoldState: FoldStateUpdater
	transactionSortPosChanged: boolean
	defSortOrder: SortOrder.State
	disableTransactionResort: boolean
	historyController: HistoryController
	sortOrder: SortOrder.Controller
	gridRow: number
}

export type ItemRowRefs = { item_id: string; cells: HTMLDivElement[] }[]

export const MultiRow = forwardRef<HTMLDivElement, MultiRowProps>((p, forwardedRef) => {
	const columnNodesRef = useRef<(HTMLDivElement | null)[]>([])
	const addToColumnNodesRef = useCallback((node: HTMLDivElement) => {
		if (node && !columnNodesRef.current.includes(node)) {
			columnNodesRef.current.push(node)
		}
	}, [])

	const itemRowsRef = useRef<ItemRowRefs>([])
	const addToItemRowsRef = useCallback(
		(item_id: string) => (node: HTMLDivElement) => {
			if (node !== null) {
				const itemRowRefIndex = itemRowsRef.current.findIndex(
					(ref) => ref.item_id === item_id
				)
				if (itemRowRefIndex === -1) {
					itemRowsRef.current.push({ item_id, cells: [node] })
				} else {
					itemRowsRef.current[itemRowRefIndex].cells.push(node)
				}
			}
		},
		[]
	)
	itemRowsRef.current = [] // wipe refs every re-render

	// re-calculates the displayed value (from default transaction or pendingChange)
	const liveVals = useMemo(
		() => genLiveVals(p.transaction, p.pendingChanges.curChanges),
		[p.transaction, p.pendingChanges.curChanges]
	)

	const uniqueCategories = (() => {
		const arr: string[] = []
		Object.values(liveVals.items).forEach((item) => {
			if (item.category_id.val !== null) {
				const categoryName = p.dropdownOptions.category.find(
					(cat) => cat.value === item.category_id.val
				)!.name
				if (
					arr.findIndex((item) => item === categoryName) === -1 &&
					categoryName !== ''
				) {
					arr.push(categoryName)
				}
			}
		})
		return arr
	})()
	const uniqueAccounts = (() => {
		const arr: string[] = []
		Object.values(liveVals.items).forEach((item) => {
			if (item.account_id.val !== null) {
				const accountName = p.dropdownOptions.account.find(
					(act) => act.value === item.account_id.val
				)!.name
				if (arr.findIndex((item) => item === accountName) === -1) {
					arr.push(accountName)
				}
			}
		})
		return arr
	})()

	const undoDeleteRef = useRef<HTMLButtonElement>(null)
	const dateSelectRef = useRef<HTMLInputElement>(null)
	const isPendingDeletion = p.pendingChanges.curDeletions.transactions.some(
		(id) => id === p.transaction.id
	)

	// paint fold state / animation after dom renders
	useEffect(() => {
		const columnNodes = columnNodesRef.current as HTMLDivElement[]
		const render = foldRenderer(columnNodes)

		if (p.folded && p.playAnimation) {
			render.foldAnimated()
		} else if (!p.folded && p.playAnimation) {
			render.unfoldAnimated()
		} else if (p.folded && !p.playAnimation) {
			render.fold()
		} else if (!p.folded && !p.playAnimation) {
			render.unfold()
		}

		// runs when this component unmounts to prevent animation bugs (e.x. when a multi-row is reordered)
		return render.cancel
	}, [p.folded, p.playAnimation])

	const eventHandlers = useMemo(() => {
		return {
			onChange: ((e) => {
				const key = e.target.dataset.key as
					| keyof LiveVals
					| keyof LiveVals['items'][number]
				const item_id = e.target.dataset.item_id
				const newVal = e.target.value

				p.historyController.clearRedo()

				// update pendingChanges
				if (item_id === undefined) {
					if (key === 'date' || key === 'name') {
						const origVal = p.transaction[key]
						if (origVal !== newVal) {
							p.pendingChanges.updateChange(
								'transactions',
								p.transaction.id,
								key,
								newVal
							)
						} else {
							p.pendingChanges.updateChange(
								'transactions',
								p.transaction.id,
								key
							)
						}
					} else {
					}
				} else {
					if (
						key === 'name' ||
						key === 'amount' ||
						key === 'category_id' ||
						key === 'account_id'
					) {
						const origVal = p.transaction.items.find(
							(item) => item.id === item_id
						)![key]
						if (origVal !== newVal) {
							p.pendingChanges.updateChange('items', item_id, key, newVal)
						} else {
							p.pendingChanges.updateChange('items', item_id, key)
						}
					} else {
					}
				}

				// update history
				const oldVal = e.target.dataset.value_on_focus
				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date') {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (key === 'name' && item_id === undefined) {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (
						(key === 'name' ||
							key === 'amount' ||
							key === 'category_id' ||
							key === 'account_id') &&
						item_id !== undefined
					) {
						p.historyController.upsert({
							type: 'item_value_change',
							transaction_id: p.transaction.id,
							item_id: item_id,
							key,
							oldVal,
							newVal,
						})
					}
				}
			}) as ChangeEventHandler<HTMLInputElement | HTMLSelectElement>,
			onBlur: ((e) => {
				const key = e.target.dataset.key as
					| keyof LiveVals
					| keyof LiveVals['items'][number]
				const item_id = e.target.dataset.item_id
				const newVal = e.target.value
				const oldVal = e.target.dataset.value_on_focus
				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date') {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (key === 'name' && item_id === undefined) {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (
						(key === 'name' ||
							key === 'amount' ||
							key === 'category_id' ||
							key === 'account_id') &&
						item_id !== undefined
					) {
						p.historyController.upsert({
							type: 'item_value_change',
							transaction_id: p.transaction.id,
							item_id: item_id,
							key,
							oldVal,
							newVal,
						})
					}
				}
			}) as FocusEventHandler<HTMLInputElement | HTMLSelectElement>,
			onFocus: ((e) => {
				e.target.dataset.value_on_focus = e.target.value
			}) as FocusEventHandler<HTMLInputElement | HTMLSelectElement>,
		}
	}, [p.transaction])

	let sum = 0
	const itemRows = p.transaction.items.map((item, itemIndex) => {
		sum += Number(liveVals.items[item.id].amount.val)

		const itemSortPosChanged =
			(
				p.defSortOrder[p.transaction.date].find(
					(it) => it[0] === p.transaction.id
				) as string[]
			).findIndex((it) => it === item.id) !==
			itemIndex + 1

		return [
			<div
				className={`${s.cell_container} ${isPendingDeletion ? s.hidden : ''}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-1`}
				ref={addToItemRowsRef(item.id)}
			>
				<div
					className={`${s.reorder_grabber} ${itemSortPosChanged ? s.changed : ''}`}
					title='Grab and drag to reposition this item'
				>
					<JButton
						jstyle='invisible'
						ref={p.sortOrder.addToItemReorderRefs(
							p.transaction,
							item,
							itemRowsRef
						)}
						tabIndex={isPendingDeletion ? -1 : undefined}
					>
						<ReorderIcon />
					</JButton>
				</div>
			</div>,
			<div
				className={s.cell_container}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-2`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDatePicker value={liveVals.date.val} disabled minimalStyle />
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].name.changed ? s.changed : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-3`}
				ref={addToItemRowsRef(item.id)}
			>
				<JInput
					value={liveVals.items[item.id].name.val}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='name'
					tabIndex={isPendingDeletion ? -1 : undefined}
					{...eventHandlers}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].amount.changed ? s.changed : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-4`}
				ref={addToItemRowsRef(item.id)}
			>
				<JNumberAccounting
					value={liveVals.items[item.id].amount.val}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='amount'
					tabIndex={isPendingDeletion ? -1 : undefined}
					{...eventHandlers}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].category_id.changed ? s.changed : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-5`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptions.category}
					value={
						liveVals.items[item.id].category_id.val !== null
							? liveVals.items[item.id].category_id.val!
							: 'none'
					}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='category_id'
					tabIndex={isPendingDeletion ? -1 : undefined}
					{...eventHandlers}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].account_id.changed ? s.changed : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-7`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptions.account}
					value={
						liveVals.items[item.id].account_id.val !== null
							? liveVals.items[item.id].account_id.val!
							: 'none'
					}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='account_id'
					tabIndex={isPendingDeletion ? -1 : undefined}
					{...eventHandlers}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${s.more_controls_container} ${
					isPendingDeletion ? s.hidden : ''
				}`}
				key={`${p.transaction.id}-${item.id}-8`}
			>
				<OptionsMenu
					width={150}
					height={140}
					test_transaction_id={p.transaction.name}
					className={s.more_controls}
					tabIndex={isPendingDeletion ? -1 : undefined}
					options={[
						{
							text: 'Delete',
							icon: <DeleteIcon />,
							onClick: () => {
								p.pendingChanges.addDeletion('transaction', p.transaction.id)
								if (undoDeleteRef.current !== null) {
									undoDeleteRef.current.focus()
								}
							},
							className: s.delete,
						},
						{
							text: 'Add Item',
							icon: <InsertRowIcon />,
							onClick: () => console.log('adding item'),
							className: s.add_item,
						},
					]}
				/>
			</div>,
		]
	})

	const firstRow = [
		<div
			className={`${s.cell_container} ${s.first_row} ${
				isPendingDeletion ? s.hidden : ''
			}`}
			key={`${p.transaction.id}-1`}
		>
			<div className={s.delete_container}>
				<JButton
					jstyle='invisible'
					onClick={() => {
						p.pendingChanges.addDeletion('transaction', p.transaction.id)
						if (undoDeleteRef.current !== null) {
							undoDeleteRef.current.focus()
						}
						if (!p.folded) {
							p.updateFoldState(p.transaction.id, true)
						}
					}}
					tabIndex={isPendingDeletion ? -1 : undefined}
				>
					<DeleteIcon />
				</JButton>
			</div>
			<div
				className={`${s.reorder_grabber} ${
					p.transactionSortPosChanged ? s.changed : ''
				}`}
				title={
					p.disableTransactionResort
						? "Repositioning not allowed while there's only one transaction under this date"
						: 'Grab and drag to reposition this item'
				}
			>
				<JButton
					jstyle='invisible'
					disabled={p.disableTransactionResort}
					ref={p.sortOrder.addToTransactionReorderRefs(p.transaction)}
					tabIndex={isPendingDeletion ? -1 : undefined}
				>
					<ReorderIcon />
				</JButton>
			</div>
			<div
				className={`${s.fold_toggle} ${p.folded || p.playAnimation ? s.folded : ''}`}
				onClick={() => p.updateFoldState(p.transaction.id)}
				title={p.folded ? 'Click to reveal items' : 'Click to hide items'}
			>
				<JButton jstyle='invisible' tabIndex={isPendingDeletion ? -1 : undefined}>
					<FoldArrow />
				</JButton>
			</div>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${
				liveVals.date.changed ? s.changed : ''
			}`}
			key={`${p.transaction.id}-2`}
		>
			<JDatePicker
				value={liveVals.date.val}
				data-transaction_id={p.transaction.id}
				data-key='date'
				ref={dateSelectRef}
				tabIndex={isPendingDeletion ? -1 : undefined}
				{...eventHandlers}
			/>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${
				liveVals.name.changed ? s.changed : ''
			}`}
			key={`${p.transaction.id}-3`}
		>
			<JInput
				value={liveVals.name.val}
				data-transaction_id={p.transaction.id}
				data-key='name'
				tabIndex={isPendingDeletion ? -1 : undefined}
				{...eventHandlers}
			/>
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-4`}>
			<JNumberAccounting value={sum} disabled minimalStyle />
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-5`}>
			<JInput value={uniqueCategories.join(', ')} disabled minimalStyle />
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-6`}>
			<JInput value={uniqueAccounts.join(', ')} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${s.more_controls_container} ${
				isPendingDeletion ? s.hidden : ''
			}`}
		>
			<OptionsMenu
				width={150}
				height={140}
				test_transaction_id={p.transaction.name}
				className={s.more_controls}
				tabIndex={isPendingDeletion ? -1 : undefined}
				options={[
					{
						text: 'Delete',
						icon: <DeleteIcon />,
						onClick: () => {
							p.pendingChanges.addDeletion('transaction', p.transaction.id)
							if (undoDeleteRef.current !== null) {
								undoDeleteRef.current.focus()
							}
							if (!p.folded) {
								p.updateFoldState(p.transaction.id, true)
							}
						},
						className: s.delete,
					},
					{
						text: 'Add Item',
						icon: <InsertRowIcon />,
						onClick: () => console.log('adding item'),
						className: s.add_item,
					},
				]}
			/>
		</div>,
	]

	const uniqueColumnClassNames = [
		s.control,
		s.date,
		s.name,
		s.amount,
		s.category,
		s.account,
		s.more_controls,
	]

	let columnCount = 0
	const genGridStyle = () => {
		columnCount++
		return {
			gridRow: `${p.gridRow} / ${p.gridRow + 1}`,
			gridColumn: `${columnCount} / ${columnCount + 1}`,
		} as React.CSSProperties
	}
	const columns = firstRow.map((rowItem, rowItemIndex) => {
		return (
			<div
				className={`${s.column} ${uniqueColumnClassNames[rowItemIndex]} ${
					p.folded && !p.playAnimation ? s.folded : ''
				}`}
				style={genGridStyle()}
				ref={addToColumnNodesRef}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return (
		<div
			className={s.container}
			style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
			ref={forwardedRef}
		>
			{columns}

			<div className={`${s.delete_overlay} ${isPendingDeletion ? s.visible : ''}`}>
				<div
					className={s.blur}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				/>
				<div
					className={s.color_overlay}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				/>
				<div
					className={s.text}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				>
					"{p.transaction.name}" will be deleted when you save changes.
				</div>
				<div
					className={s.button_container}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				>
					<JButton
						jstyle='invisible'
						onClick={() => {
							p.pendingChanges.removeDeletion('transaction', p.transaction.id)
							if (dateSelectRef.current !== null) {
								dateSelectRef.current.focus()
							}
						}}
						ref={undoDeleteRef}
						tabIndex={isPendingDeletion ? undefined : -1}
					>
						Undo Delete
					</JButton>
				</div>
			</div>
		</div>
	)
})
