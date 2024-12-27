import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as InsertRowIcon } from '@/public/insert_row.svg'
import s from './SingleRow.module.scss'
import {
	ChangeEventHandler,
	FocusEventHandler,
	forwardRef,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { FormTransaction } from '../../TransactionManager'
import { genLiveVals, LiveVals } from './genLiveVals'
import { HistoryController } from '../../hooks/useHistory'
import { PendingChanges } from '../../hooks/usePendingChanges'
import { SortOrder } from '../../hooks'
import { OptionsMenu } from '../OptionsMenu/OptionsMenu'

export interface SingleRowProps {
	transaction: FormTransaction
	pendingChanges: PendingChanges.Controller
	dropdownOptions: { category: JDropdownTypes.Option[]; account: JDropdownTypes.Option[] }
	// onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
	sortPosChanged: boolean
	disableTransactionResort: boolean
	historyController: HistoryController
	sortOrder: SortOrder.Controller
	gridRow: number
}
export const SingleRow = forwardRef<HTMLDivElement, SingleRowProps>((p, forwardedRef) => {
	const item = p.transaction.items[0]
	const undoDeleteRef = useRef<HTMLButtonElement>(null)
	const dateSelectRef = useRef<HTMLInputElement>(null)

	const liveVals = useMemo(
		() => genLiveVals(p.transaction, p.pendingChanges.curChanges),
		[p.transaction, p.pendingChanges.curChanges]
	)
	const eventHandlers = useMemo(() => {
		return {
			onChange: ((e) => {
				const key = e.target.dataset.key as keyof LiveVals
				const item_id = item.id
				const newVal = e.target.value

				p.historyController.clearRedo()

				// update pendingChanges
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
						p.pendingChanges.updateChange('transactions', p.transaction.id, key)
					}
				} else if (
					key === 'amount' ||
					key === 'category_id' ||
					key === 'account_id'
				) {
					const origVal = p.transaction.items.find((item) => item.id === item_id)![
						key
					]
					if (origVal !== newVal) {
						p.pendingChanges.updateChange('items', item_id, key, newVal)
					} else {
						p.pendingChanges.updateChange('items', item_id, key)
					}
				}

				// update history
				const oldVal = e.target.dataset.value_on_focus
				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date' || key === 'name') {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (
						key === 'amount' ||
						key === 'category_id' ||
						key === 'account_id'
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
				const key = e.target.dataset.key as keyof LiveVals
				const item_id = item.id
				const newVal = e.target.value
				const oldVal = e.target.dataset.value_on_focus

				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date' || key === 'name') {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (
						key === 'amount' ||
						key === 'category_id' ||
						key === 'account_id'
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

	const isPendingDeletion = p.pendingChanges.curDeletions.transactions.some(
		(id) => id === p.transaction.id
	)

	let columnCount = 0
	const genGridStyle = () => {
		columnCount++
		return {
			gridRow: `${p.gridRow} / ${p.gridRow + 1}`,
			gridColumn: `${columnCount} / ${columnCount + 1}`,
		} as React.CSSProperties
	}

	return (
		<div
			className={s.container}
			style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
			ref={forwardedRef}
		>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.row_controller} ${
					isPendingDeletion ? s.hidden : ''
				}`}
			>
				<div className={s.delete_container}>
					<JButton
						jstyle='invisible'
						onClick={() => {
							p.pendingChanges.addDeletion('transaction', p.transaction.id)
							if (undoDeleteRef.current !== null) {
								undoDeleteRef.current.focus()
							}
						}}
						tabIndex={isPendingDeletion ? -1 : undefined}
					>
						<DeleteIcon />
					</JButton>
				</div>
				<div
					className={`${s.reorder_grabber} ${p.sortPosChanged ? s.changed : ''}`}
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
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.first_col} ${
					liveVals.date.changed ? s.changed : ''
				}`}
			>
				<JDatePicker
					value={liveVals.date.val}
					data-transaction_id={p.transaction.id}
					data-key='date'
					{...eventHandlers}
					tabIndex={isPendingDeletion ? -1 : undefined}
					ref={dateSelectRef}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.mid_col} ${
					liveVals.name.changed ? s.changed : ''
				}`}
			>
				<JInput
					value={liveVals.name.val}
					data-transaction_id={p.transaction.id}
					data-key='name'
					{...eventHandlers}
					tabIndex={isPendingDeletion ? -1 : undefined}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.mid_col} ${
					liveVals.amount.changed ? s.changed : ''
				}`}
			>
				<JNumberAccounting
					value={liveVals.amount.val}
					data-transaction_id={p.transaction.id}
					data-item_id={p.transaction.items[0].id}
					data-key='amount'
					maxDigLeftOfDecimal={8}
					maxDigRightOfDecimal={2}
					{...eventHandlers}
					tabIndex={isPendingDeletion ? -1 : undefined}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.mid_col} ${
					liveVals.category_id.changed ? s.changed : ''
				}`}
			>
				<JDropdown
					options={p.dropdownOptions.category}
					value={
						liveVals.category_id.val !== null
							? liveVals.category_id.val
							: undefined
					}
					data-transaction_id={p.transaction.id}
					data-item_id={p.transaction.items[0].id}
					data-key='category_id'
					{...eventHandlers}
					tabIndex={isPendingDeletion ? -1 : undefined}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.last_col} ${
					liveVals.account_id.changed ? s.changed : ''
				}`}
			>
				<JDropdown
					options={p.dropdownOptions.account}
					value={
						liveVals.account_id.val !== null
							? liveVals.account_id.val
							: undefined
					}
					data-transaction_id={p.transaction.id}
					data-item_id={p.transaction.items[0].id}
					data-key='account_id'
					{...eventHandlers}
					tabIndex={isPendingDeletion ? -1 : undefined}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.more_controls_container} ${
					isPendingDeletion ? s.hidden : ''
				}`}
				style={genGridStyle()}
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
			</div>
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
