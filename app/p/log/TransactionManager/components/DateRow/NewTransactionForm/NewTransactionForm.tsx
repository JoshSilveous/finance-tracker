import { JInput, JNumberAccounting } from '@/components/JForm'
import s from './NewTransactionForm.module.scss'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JRadio } from '@/components/JForm/JRadio/JRadio'
import { useEffect, useState } from 'react'
import { FetchedAccount, FetchedCategory } from '@/database'
import { JGridTypes } from '@/components/JGrid/JGrid'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { DropdownOptions } from '../../../TransactionManager'

interface TransactionFormData {
	name: string
	date: string
	items: {
		name: string
		amount: string
		category_id: string
		account_id: string
	}[]
}

interface NewTransactionFormProps {
	defaultDate?: string
	dropdownOptions: DropdownOptions
}

export function NewTransactionForm({
	defaultDate,
	dropdownOptions,
}: NewTransactionFormProps) {
	const [isMultiItems, setIsMultiItems] = useState(false)
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
					<input
						type='checkbox'
						checked={isMultiItems}
						onChange={(e) => setIsMultiItems(e.target.checked)}
					/>
				</div>
				<div className={s.single_item}>
					<div>
						<label htmlFor='item_amount'>Amount:</label>
						<JNumberAccounting value={0} />
					</div>
					<div>
						<label htmlFor='item_category'>Category:</label>
						<JDropdown options={dropdownOptions.category} />
					</div>
					<div>
						<label htmlFor='item_account'>Account:</label>
						<JDropdown options={dropdownOptions.account} />
					</div>
				</div>
			</form>
		</div>
	)
}
