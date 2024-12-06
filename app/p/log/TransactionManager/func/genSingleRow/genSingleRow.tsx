import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './genSingleRow.module.scss'

export interface GenSingleRowProps {
	transaction: FetchedTransaction
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}
export function genSingleRow({
	transaction,
	dropdownOptionsCategory,
	dropdownOptionsAccount,
	onResortMouseDown,
}: GenSingleRowProps) {
	const transactionItem = transaction.items[0]
	return [
		<div className={s.row_controller}>
			<div
				className={s.reorder_grabber}
				onMouseDown={onResortMouseDown}
				title='Grab and drag to reposition this item'
			>
				<ReorderIcon />
			</div>
		</div>,
		<div className={`${s.cell_container} ${s.first_col}`}>
			<JDatePicker value={transaction.date} />
		</div>,
		<div className={`${s.cell_container} ${s.mid_col}`}>
			<JInput value={transaction.name} />
		</div>,
		<div className={`${s.cell_container} ${s.mid_col}`}>
			<JNumberAccounting value={transactionItem.amount} />
		</div>,
		<div className={`${s.cell_container} ${s.mid_col}`}>
			<JDropdown
				options={dropdownOptionsCategory}
				value={
					transactionItem.category_id !== null
						? transactionItem.category_id
						: undefined
				}
			/>
		</div>,
		<div className={`${s.cell_container} ${s.last_col}`}>
			<JDropdown
				options={dropdownOptionsAccount}
				value={
					transactionItem.account_id !== null
						? transactionItem.account_id
						: undefined
				}
			/>
		</div>,
	]
}
