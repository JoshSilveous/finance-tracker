import { JInput } from '@/components/JForm'
import s from './NewTransactionForm.module.scss'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JRadio } from '@/components/JForm/JRadio/JRadio'

export function NewTransactionForm({ defaultDate }: { defaultDate?: string }) {
	return (
		<div className={s.main}>
			<h2>Create New Transaction</h2>
			<form>
				<div>
					<label htmlFor='transaction_name'>Name:</label>
					<JInput />
				</div>
				<div>
					<label htmlFor='transaction_name'>Date:</label>
					<JDatePicker defaultValue={defaultDate} />
				</div>
				<div>
					<label htmlFor='multiple_items'>Multiple Items?</label>
					{/* need a jcheckbox */}
				</div>
			</form>
		</div>
	)
}
