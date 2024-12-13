import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './SingleRow.module.scss'
import { ChangeEvent, forwardRef, useEffect } from 'react'

export interface SingleRowProps {
	curTransaction: FetchedTransaction
	defTransaction: FetchedTransaction
	placeMarginAbove: boolean
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}
export const SingleRow = forwardRef<HTMLDivElement, SingleRowProps>(
	(props, forwardedRef) => {
		const transactionItem = props.curTransaction.items[0]

		function handleChange(e: ChangeEvent<HTMLInputElement>) {
			console.log(e)
		}

		return (
			<div
				className={s.container}
				ref={forwardedRef}
				data-transaction_id={props.curTransaction.id}
			>
				<div
					className={`${s.cell_container} ${s.row_controller} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<div
						className={s.reorder_grabber}
						onMouseDown={props.onResortMouseDown}
						title='Grab and drag to reposition this item'
					>
						<ReorderIcon />
					</div>
				</div>
				<div
					className={`${s.cell_container} ${s.first_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JDatePicker value={props.curTransaction.date} onChange={handleChange} />
				</div>
				<div
					className={`${s.cell_container} ${s.mid_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JInput value={props.curTransaction.name} />
				</div>
				<div
					className={`${s.cell_container} ${s.mid_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JNumberAccounting value={transactionItem.amount} />
				</div>
				<div
					className={`${s.cell_container} ${s.mid_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JDropdown
						options={props.dropdownOptionsCategory}
						value={
							transactionItem.category_id !== null
								? transactionItem.category_id
								: undefined
						}
					/>
				</div>
				<div
					className={`${s.cell_container} ${s.last_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JDropdown
						options={props.dropdownOptionsAccount}
						value={
							transactionItem.account_id !== null
								? transactionItem.account_id
								: undefined
						}
					/>
				</div>
			</div>
		)
	}
)
