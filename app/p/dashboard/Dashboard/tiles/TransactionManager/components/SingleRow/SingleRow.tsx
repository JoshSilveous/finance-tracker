import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as InsertRowIcon } from '@/public/insert_row.svg'
import s from './SingleRow.module.scss'
import { ChangeEventHandler, FocusEventHandler, forwardRef, useMemo, useRef } from 'react'
import { TabIndexer } from '../../hooks'
import { OptionsMenu } from '../OptionsMenu/OptionsMenu'
import { DashboardController, Data } from '../../../../hooks'
import { handleReorderMouseDown } from './func/handleReorderMouseDown'

export interface SingleRowProps {
	transaction: Data.StateTransaction
	transactionIndex: number
	dashCtrl: DashboardController
	dropdownOptions: { category: JDropdownTypes.Option[]; account: JDropdownTypes.Option[] }
	sortPosChanged: boolean
	disableTransactionResort: boolean
	gridRow: number
	tabIndexer: TabIndexer
	gridNavIndex: number
}
export const SingleRow = forwardRef<HTMLDivElement, SingleRowProps>((p, forwardedRef) => {
	const item = p.transaction.items[0]
	const undoDeleteRef = useRef<HTMLButtonElement>(null)
	const dateSelectRef = useRef<HTMLInputElement>(null)

	const eventHandlers = useMemo(() => {
		return {
			onChange: ((e) => {
				const key = e.target.dataset.key as
					| 'date'
					| 'name'
					| 'amount'
					| 'category_id'
					| 'account_id'
				const item_id = item.id
				const newVal = e.target.value

				p.dashCtrl.history.clearRedo()

				// update pendingChanges
				if (key === 'date' || key === 'name') {
					p.dashCtrl.data.update('transaction', p.transaction.id, key, newVal)
				} else if (
					key === 'amount' ||
					key === 'category_id' ||
					key === 'account_id'
				) {
					p.dashCtrl.data.update('item', item_id, p.transaction.id, key, newVal)
				}

				// update history
				const oldVal = e.target.dataset.value_on_focus
				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date' || key === 'name') {
						p.dashCtrl.history.upsert({
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
						p.dashCtrl.history.upsert({
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
					| 'date'
					| 'name'
					| 'amount'
					| 'category_id'
					| 'account_id'
				const item_id = item.id
				const newVal = e.target.value
				const oldVal = e.target.dataset.value_on_focus

				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date' || key === 'name') {
						p.dashCtrl.history.upsert({
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
						p.dashCtrl.history.upsert({
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
			data-transaction_row_id={p.transaction.id}
		>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.row_controller} ${
					p.transaction.pendingDeletion ? s.hidden : ''
				}`}
			>
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
						onMouseDown={handleReorderMouseDown(
							p.transaction,
							p.transactionIndex,
							p.dashCtrl.sortOrder,
							(oldIndex, newIndex) => {
								console.log(oldIndex, newIndex)
								p.dashCtrl.sortOrder.updateTransactionPosition(
									p.transaction.date.orig,
									oldIndex,
									newIndex
								)
							}
						)}
						tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
						data-grid_nav_col='TM_left_controls'
						data-grid_nav_index={p.gridNavIndex}
					>
						<ReorderIcon />
					</JButton>
				</div>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.first_col} ${
					p.transaction.date.changed ? s.changed : ''
				}`}
			>
				<JDatePicker
					value={p.transaction.date.val}
					data-transaction_id={p.transaction.id}
					data-key='date'
					{...eventHandlers}
					tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
					ref={dateSelectRef}
					data-grid_nav_col='TM_date'
					data-grid_nav_index={p.gridNavIndex}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.mid_col} ${
					p.transaction.name.changed ? s.changed : ''
				}`}
			>
				<JInput
					value={p.transaction.name.val}
					data-transaction_id={p.transaction.id}
					data-key='name'
					{...eventHandlers}
					tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
					data-grid_nav_col='TM_name'
					data-grid_nav_index={p.gridNavIndex}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.mid_col} ${
					item.amount.changed ? s.changed : ''
				}`}
			>
				<JNumberAccounting
					value={item.amount.val}
					data-transaction_id={p.transaction.id}
					data-item_id={p.transaction.items[0].id}
					data-key='amount'
					maxDigLeftOfDecimal={8}
					maxDigRightOfDecimal={2}
					{...eventHandlers}
					tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
					data-grid_nav_col='TM_amount'
					data-grid_nav_index={p.gridNavIndex}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.mid_col} ${
					item.category_id.changed ? s.changed : ''
				}`}
			>
				<JDropdown
					options={p.dropdownOptions.category}
					value={item.category_id.val !== null ? item.category_id.val : undefined}
					data-transaction_id={p.transaction.id}
					data-item_id={p.transaction.items[0].id}
					data-key='category_id'
					{...eventHandlers}
					tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
					data-grid_nav_col='TM_category'
					data-grid_nav_index={p.gridNavIndex}
				/>
			</div>
			<div
				style={genGridStyle()}
				className={`${s.cell_container} ${s.last_col} ${
					item.account_id.changed ? s.changed : ''
				}`}
			>
				<JDropdown
					options={p.dropdownOptions.account}
					value={item.account_id.val !== null ? item.account_id.val : undefined}
					data-transaction_id={p.transaction.id}
					data-item_id={p.transaction.items[0].id}
					data-key='account_id'
					{...eventHandlers}
					tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
					data-grid_nav_col='TM_account'
					data-grid_nav_index={p.gridNavIndex}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.more_controls_container} ${
					p.transaction.pendingDeletion ? s.hidden : ''
				}`}
				style={genGridStyle()}
			>
				<OptionsMenu
					width={150}
					height={110}
					test_transaction_id={p.transaction.name.val}
					className={s.more_controls}
					tabIndex={p.transaction.pendingDeletion ? undefined : p.tabIndexer()}
					data-grid_nav_col='TM_right_controls'
					data-grid_nav_index={p.gridNavIndex}
					options={[
						{
							text: 'Delete',
							icon: <DeleteIcon />,
							onClick: () => {
								p.dashCtrl.data.stageDelete('transaction', p.transaction.id)
								if (undoDeleteRef.current !== null) {
									undoDeleteRef.current.focus()
								}
							},
							className: s.delete,
						},
						{
							text: 'Add Item',
							icon: <InsertRowIcon />,
							onClick: () =>
								p.dashCtrl.data.stageCreate(
									'item',
									p.transaction.id,
									1,
									p.transaction.date.val
								),
							className: s.add_item,
						},
					]}
				/>
			</div>
			<div
				className={`${s.delete_overlay} ${
					p.transaction.pendingDeletion ? s.visible : ''
				}`}
			>
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
					&quot;{p.transaction.name.val}&quot; will be deleted when you save
					changes.
				</div>
				<div
					className={s.button_container}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				>
					<JButton
						jstyle='invisible'
						onClick={() => {
							p.dashCtrl.data.unstageDelete('transaction', p.transaction.id)
							if (dateSelectRef.current !== null) {
								dateSelectRef.current.focus()
							}
						}}
						ref={undoDeleteRef}
						tabIndex={p.transaction.pendingDeletion ? p.tabIndexer() : -1}
					>
						Undo Delete
					</JButton>
				</div>
			</div>
		</div>
	)
})

SingleRow.displayName = 'SingleRow'
