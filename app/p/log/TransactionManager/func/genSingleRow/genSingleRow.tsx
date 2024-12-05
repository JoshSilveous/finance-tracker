import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import s from './genSingleRow.module.scss'

export function genSingleRow(
	transaction: FetchedTransaction,
	dropdownOptionsCategory: JDropdownTypes.Option[],
	dropdownOptionsAccount: JDropdownTypes.Option[]
) {
	const transactionItem = transaction.items[0]
	return [
		<div className={s.row_controller}></div>,
		<div className={`${s.data_container} ${s.single_item} ${s.first_col}`}>
			<JDatePicker value={transaction.date} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JInput value={transaction.name} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JNumberAccounting value={transactionItem.amount} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JDropdown
				options={dropdownOptionsCategory}
				value={
					transactionItem.category_id !== null
						? transactionItem.category_id
						: undefined
				}
			/>
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.last_col}`}>
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
