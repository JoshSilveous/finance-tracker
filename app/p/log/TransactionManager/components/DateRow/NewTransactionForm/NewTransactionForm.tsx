import { JInput, JNumberAccounting } from '@/components/JForm'
import s from './NewTransactionForm.module.scss'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { useState } from 'react'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import { DropdownOptions } from '../../../TransactionManager'
import { MultiItemGrid } from './MultiItemGrid'

export interface TransactionFormData {
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
	defaultDate: string
	dropdownOptions: DropdownOptions
}

type Type = 'transaction' | 'item'
type Key = 'name' | 'date' | 'amount' | 'category_id' | 'account_id'

export function NewTransactionForm({
	defaultDate,
	dropdownOptions,
}: NewTransactionFormProps) {
	const [formData, setFormData] = useState<TransactionFormData>({
		name: '',
		date: defaultDate,
		items: [{ name: '', amount: '', category_id: '', account_id: '' }],
	})
	const [isMultiItems, setIsMultiItems] = useState(false)

	const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (
		e
	) => {
		const [type, key, item_index] = e.target.id.split('-') as [Type, Key, string?]
		const val = e.target.value

		if (type === 'transaction') {
			if (key === 'name' || key === 'date') {
				setFormData((prev) => {
					const clone = structuredClone(prev)
					clone[key] = val
					return clone
				})
			}
		} else if (
			type === 'item' &&
			item_index !== undefined &&
			!isNaN(parseInt(item_index))
		) {
			if (
				key === 'name' ||
				key === 'amount' ||
				key === 'account_id' ||
				key === 'category_id'
			) {
				setFormData((prev) => {
					const clone = structuredClone(prev)
					clone.items[parseInt(item_index)][key] = val
					return clone
				})
			}
		}

		console.log('\ntype', type, '\nkey', key, '\nitem_num', item_index, '\nval', val)
	}

	return (
		<div className={s.main}>
			<h2>Create New Transaction</h2>
			<form>
				<div className={s.split_col}>
					<div>
						<label htmlFor='transaction-name'>Name:</label>
						<JInput
							id='transaction-name'
							onChange={handleChange}
							value={formData.name}
						/>
					</div>
					<div>
						<label htmlFor='transaction-date'>Date:</label>
						<JDatePicker
							id='transaction-date'
							onChange={handleChange}
							value={formData.date}
						/>
					</div>
				</div>
				<div>
					<label htmlFor='multiple-items'>Multiple Items?</label>
					{/* need a jcheckbox */}
					<input
						type='checkbox'
						id='multiple-items'
						checked={isMultiItems}
						onChange={(e) => setIsMultiItems(e.target.checked)}
					/>
				</div>
				{isMultiItems ? (
					<MultiItemGrid
						{...{ items: formData.items, handleChange, dropdownOptions }}
					/>
				) : (
					<div className={s.items_container}>
						<div className={s.item}>
							<div>
								<label htmlFor='item-amount-0'>Amount:</label>
								<JNumberAccounting
									id='item-amount-0'
									value={formData.items[0].amount}
									onChange={handleChange}
								/>
							</div>
							<div>
								<label htmlFor='item-category_id-0'>Category:</label>
								<JDropdown
									id='item-category_id-0'
									options={dropdownOptions.category}
									value={formData.items[0].category_id}
									onChange={handleChange}
								/>
							</div>
							<div>
								<label htmlFor='item-account_id-0'>Account:</label>
								<JDropdown
									id='item-account_id-0'
									options={dropdownOptions.account}
									value={formData.items[0].account_id}
									onChange={handleChange}
								/>
							</div>
						</div>
					</div>
				)}
			</form>
		</div>
	)
}
