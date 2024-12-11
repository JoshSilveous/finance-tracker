import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './SingleRow.module.scss'

export interface SingleRowProps {
	transaction: FetchedTransaction
	placeMarginAbove: boolean
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}
export function SingleRow({
	transaction,
	placeMarginAbove,
	dropdownOptionsCategory,
	dropdownOptionsAccount,
	onResortMouseDown,
}: SingleRowProps) {
	const transactionItem = transaction.items[0]

	return (
		<div className={s.container}>
			<div
				className={`${s.cell_container} ${s.row_controller} ${
					placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={transaction.id}
			>
				<div
					className={s.reorder_grabber}
					onMouseDown={onResortMouseDown}
					title='Grab and drag to reposition this item'
				>
					<ReorderIcon />
				</div>
			</div>
			<div
				className={`${s.cell_container} ${s.first_col} ${
					placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={transaction.id}
			>
				<JDatePicker value={transaction.date} />
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={transaction.id}
			>
				<JInput value={transaction.name} />
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={transaction.id}
			>
				<JNumberAccounting value={transactionItem.amount} />
			</div>
			<div
				className={`${s.cell_container} ${s.mid_col} ${
					placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={transaction.id}
			>
				<JDropdown
					options={dropdownOptionsCategory}
					value={
						transactionItem.category_id !== null
							? transactionItem.category_id
							: undefined
					}
				/>
			</div>
			<div
				className={`${s.cell_container} ${s.last_col} ${
					placeMarginAbove ? s.margin_above : ''
				}`}
				data-transaction_id={transaction.id}
			>
				<JDropdown
					options={dropdownOptionsAccount}
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
