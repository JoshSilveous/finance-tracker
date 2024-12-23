import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './SingleRow.module.scss'
import { ChangeEventHandler, FocusEventHandler, forwardRef, useMemo } from 'react'
import { FormTransaction } from '../../TransactionManager'
import { genLiveVals, LiveVals } from './genLiveVals'
import { HistoryController } from '../../hooks/useHistory'
import { PendingChanges } from '../../hooks/usePendingChanges'
import { SortOrder } from '../../hooks'

export interface SingleRowProps {
	transaction: FormTransaction
	pendingChanges: PendingChanges.Controller
	dropdownOptions: { category: JDropdownTypes.Option[]; account: JDropdownTypes.Option[] }
	// onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
	sortPosChanged: boolean
	disableTransactionResort: boolean
	historyController: HistoryController
	sortOrder: SortOrder.Controller
}
export const SingleRow = forwardRef<HTMLDivElement, SingleRowProps>((p, forwardedRef) => {
	const item = p.transaction.items[0]

	const liveVals = useMemo(
		() => genLiveVals(p.transaction, p.pendingChanges.cur),
		[p.transaction, p.pendingChanges.cur]
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
						p.pendingChanges.update(
							'transactions',
							p.transaction.id,
							key,
							newVal
						)
					} else {
						p.pendingChanges.update('transactions', p.transaction.id, key)
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
						p.pendingChanges.update('items', item_id, key, newVal)
					} else {
						p.pendingChanges.update('items', item_id, key)
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
	}, [])

	return (
		<div className={s.container} ref={forwardedRef}>
			<div className={`${s.cell_container} ${s.row_controller} `}>
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
					>
						<ReorderIcon />
					</JButton>
				</div>
			</div>
			<div
				className={`${s.cell_container} ${s.first_col} ${
					liveVals.date.changed ? s.changed : ''
				}`}
			>
				<JDatePicker
					value={liveVals.date.val}
					data-transaction_id={p.transaction.id}
					data-key='date'
					{...eventHandlers}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					liveVals.name.changed ? s.changed : ''
				}`}
			>
				<JInput
					value={liveVals.name.val}
					data-transaction_id={p.transaction.id}
					data-key='name'
					{...eventHandlers}
				/>
			</div>
			<div
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
				/>
			</div>
			<div
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
				/>
			</div>
			<div
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
				/>
			</div>
		</div>
	)
})
