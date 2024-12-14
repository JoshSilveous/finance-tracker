import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './SingleRow.module.scss'
import {
	ChangeEvent,
	ChangeEventHandler,
	Dispatch,
	forwardRef,
	SetStateAction,
	useEffect,
	useMemo,
} from 'react'
import {
	PendingChanges,
	StateTransaction,
	PendingChangeUpdater,
} from '../TransactionManager'

type LiveVals = {
	amount: string
	category_id: string | null
	account_id: string | null
	date: string
	name: string
}

export interface SingleRowProps {
	transaction: StateTransaction
	pendingChanges: PendingChanges
	updatePendingChanges: PendingChangeUpdater
	placeMarginAbove: boolean
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}
export const SingleRow = forwardRef<HTMLDivElement, SingleRowProps>((p, forwardedRef) => {
	const transaction_id = p.transaction.id
	const curItem = p.transaction.items[0]
	const item_id = curItem.id
	const defItem = p.transaction.items[0]

	/**
	 * Re-calculates the displayed value (from default transaction or pendingChange)
	 */
	const liveVals: LiveVals = useMemo(
		() => ({
			amount:
				p.pendingChanges.items[item_id] !== undefined &&
				p.pendingChanges.items[item_id].amount !== undefined
					? p.pendingChanges.items[item_id].amount
					: curItem.amount,
			category_id:
				p.pendingChanges.items[item_id] !== undefined &&
				p.pendingChanges.items[item_id].category_id !== undefined
					? p.pendingChanges.items[item_id].category_id
					: curItem.category_id,
			account_id:
				p.pendingChanges.items[item_id] !== undefined &&
				p.pendingChanges.items[item_id].account_id !== undefined
					? p.pendingChanges.items[item_id].account_id
					: curItem.account_id,
			date:
				p.pendingChanges.transactions[transaction_id] !== undefined &&
				p.pendingChanges.transactions[transaction_id].date !== undefined
					? p.pendingChanges.transactions[transaction_id].date
					: p.transaction.date,
			name:
				p.pendingChanges.transactions[transaction_id] !== undefined &&
				p.pendingChanges.transactions[transaction_id].name !== undefined
					? p.pendingChanges.transactions[transaction_id].name
					: p.transaction.name,
		}),
		[p.transaction, p.pendingChanges]
	)

	const onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
		const origVal = e.target.dataset.default
		const key = e.target.dataset.key as keyof LiveVals
		const newVal = e.target.value

		if (origVal !== newVal) {
			e.target.parentElement!.classList.add(s.pending_change)

			if (key === 'name' || key === 'date') {
				p.updatePendingChanges('transactions', transaction_id, key, newVal)
			} else {
				p.updatePendingChanges('items', item_id, key, newVal)
			}
		} else {
			e.target.parentElement!.classList.remove(s.pending_change)

			if (key === 'name' || key === 'date') {
				p.updatePendingChanges('transactions', transaction_id, key)
			} else {
				p.updatePendingChanges('items', item_id, key)
			}
		}
	}

	return (
		<div
			className={s.container}
			ref={forwardedRef}
			data-transaction_id={p.transaction.id}
		>
			<div
				className={`${s.cell_container} ${s.row_controller} ${
					p.placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={p.transaction.id}
			>
				<div
					className={s.reorder_grabber}
					onMouseDown={p.onResortMouseDown}
					title='Grab and drag to reposition this item'
				>
					<ReorderIcon />
				</div>
			</div>
			<div
				className={`${s.cell_container} ${s.first_col} ${
					p.placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={p.transaction.id}
			>
				<JDatePicker
					value={liveVals.date}
					data-key={'date'}
					data-default={p.transaction.date}
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					p.placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={p.transaction.id}
			>
				<JInput
					value={liveVals.name}
					data-key={'name'}
					data-default={p.transaction.name}
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					p.placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={p.transaction.id}
			>
				<JNumberAccounting
					value={liveVals.amount}
					data-key={'amount'}
					data-default={defItem.amount}
					onChange={onChange}
					onBlur={onChange}
					maxDigLeftOfDecimal={8}
					maxDigRightOfDecimal={2}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					p.placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={p.transaction.id}
			>
				<JDropdown
					options={p.dropdownOptionsCategory}
					value={liveVals.category_id !== null ? liveVals.category_id : undefined}
					data-key={'category_id'}
					data-default={
						defItem.category_id !== null ? defItem.category_id : undefined
					}
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.last_col} ${
					p.placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={p.transaction.id}
			>
				<JDropdown
					options={p.dropdownOptionsAccount}
					value={liveVals.account_id !== null ? liveVals.account_id : undefined}
					data-key={'account_id'}
					data-default={
						defItem.account_id !== null ? defItem.account_id : undefined
					}
					onChange={onChange}
					onBlur={onChange}
				/>
			</div>
		</div>
	)
})
