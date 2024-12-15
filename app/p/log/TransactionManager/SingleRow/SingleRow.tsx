import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './SingleRow.module.scss'
import { ChangeEventHandler, forwardRef, useCallback, useMemo } from 'react'
import {
	PendingChanges,
	StateTransaction,
	PendingChangeUpdater,
} from '../TransactionManager'
import { genLiveVals, LiveVals } from './genLiveVals'

export interface SingleRowProps {
	transaction: StateTransaction
	pendingChanges: PendingChanges
	updatePendingChanges: PendingChangeUpdater
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
	sortPosChanged: boolean
}
export const SingleRow = forwardRef<HTMLDivElement, SingleRowProps>((p, forwardedRef) => {
	const item = p.transaction.items[0]

	const liveVals = useMemo(
		() => genLiveVals(p.transaction, p.pendingChanges),
		[p.transaction, p.pendingChanges]
	)

	const onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = useCallback(
		(e) => {
			const key = e.target.dataset.key as keyof LiveVals
			const item_id = item.id
			const newVal = e.target.value

			if (key === 'date' || key === 'name') {
				const origVal = p.transaction[key]
				if (origVal !== newVal) {
					p.updatePendingChanges('transactions', p.transaction.id, key, newVal)
				} else {
					p.updatePendingChanges('transactions', p.transaction.id, key)
				}
			} else if (key === 'amount' || key === 'category_id' || key === 'account_id') {
				const origVal = p.transaction.items.find((item) => item.id === item_id)![key]
				if (origVal !== newVal) {
					p.updatePendingChanges('items', item_id, key, newVal)
				} else {
					p.updatePendingChanges('items', item_id, key)
				}
			}
		},
		[]
	)

	return (
		<div className={s.container} ref={forwardedRef}>
			<div className={`${s.cell_container} ${s.row_controller} `}>
				<div
					className={`${s.reorder_grabber} ${p.sortPosChanged ? s.changed : ''}`}
					onMouseDown={p.onResortMouseDown}
					title='Grab and drag to reposition this item'
				>
					<ReorderIcon />
				</div>
			</div>
			<div
				className={`${s.cell_container} ${s.first_col} ${
					liveVals.date.changed ? s.changed : ''
				}`}
			>
				<JDatePicker
					value={liveVals.date.val}
					data-key='date'
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					liveVals.name.changed ? s.changed : ''
				}`}
			>
				<JInput
					value={liveVals.name.val}
					data-key='name'
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					liveVals.amount.changed ? s.changed : ''
				}`}
			>
				<JNumberAccounting
					value={liveVals.amount.val}
					data-key='amount'
					onChange={onChange}
					onBlur={onChange}
					maxDigLeftOfDecimal={8}
					maxDigRightOfDecimal={2}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					liveVals.category_id.changed ? s.changed : ''
				}`}
			>
				<JDropdown
					options={p.dropdownOptionsCategory}
					value={
						liveVals.category_id.val !== null
							? liveVals.category_id.val
							: undefined
					}
					data-key='category_id'
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.last_col} ${
					liveVals.account_id.changed ? s.changed : ''
				}`}
			>
				<JDropdown
					options={p.dropdownOptionsAccount}
					value={
						liveVals.account_id.val !== null
							? liveVals.account_id.val
							: undefined
					}
					data-key='account_id'
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
		</div>
	)
})
