import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import s from './NewTransactionForm.module.scss'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import { DropdownOptions } from '../../../TransactionManager'
import { MultiItemGrid } from './MultiItemGrid'
import { delay, isStandardError, promptError, setKeyListenerContext } from '@/utils'
import { insertTransactionAndItems } from '@/database'
import { JCheckbox } from '@/components/JForm/JCheckbox/JCheckbox'
import { useFocusLoop } from '@/utils/focusLoop/useFocusLoop'

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
	const firstFocusRef = useRef<HTMLInputElement | null>(null)
	const lastFocusRef = useRef<HTMLButtonElement | null>(null)
	const [isMultiItems, setIsMultiItems] = useState(false)
	const [missingItems, setMissingItems] = useState<string[]>([])
	const [submitting, setSubmitting] = useState(false)

	useFocusLoop(firstFocusRef, lastFocusRef)

	useEffect(() => {
		firstFocusRef.current!.focus()
		setKeyListenerContext('NewTransactionForm')
	}, [])

	// check if form is ready to submit
	useEffect(() => {
		const updatedMissingItems = []
		if (formData.name.trim() === '') {
			updatedMissingItems.push('transaction-name')
		}
		if (formData.date.trim() === '') {
			updatedMissingItems.push('transaction-date')
		}
		if (!isMultiItems) {
			if (formData.items[0].amount === '') {
				updatedMissingItems.push(`item-amount-0`)
			}
		} else {
			formData.items.forEach((item, index) => {
				if (item.name.trim() === '') {
					updatedMissingItems.push(`item-name-${index}`)
				}
				if (item.amount === '') {
					updatedMissingItems.push(`item-amount-${index}`)
				}
			})
		}
		setMissingItems(updatedMissingItems)
	}, [formData, isMultiItems])

	const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> =
		useCallback((e) => {
			const [type, key, item_index] = e.target.id.split('-') as [Type, Key, string?]
			const val = e.target.value
			if (key === 'amount') {
				const actInput = e.currentTarget
				const actFormatted = actInput.parentElement!.childNodes[2] as HTMLDivElement
				actInput.classList.remove(s.error)
				actFormatted.classList.remove(s.error)
			} else {
				e.currentTarget.classList.remove(s.error)
			}

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
		}, [])

	const handleSubmit: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
		if (missingItems.length !== 0) {
			const node = e.currentTarget

			node.classList.add(s.error_shake, s.error)
			missingItems.forEach((id) => {
				const key = id.split('-')[1] as Key
				if (key === 'amount') {
					const actInput = document.getElementById(id) as HTMLInputElement
					const actFormatted = actInput.parentElement!
						.childNodes[2] as HTMLDivElement
					actInput.classList.add(s.error_shake, s.error)
					actFormatted.classList.add(s.error_shake, s.error)
				} else {
					document.getElementById(id)!.classList.add(s.error_shake, s.error)
				}
			})

			delay(300).then(() => {
				missingItems.forEach((id) => {
					const key = id.split('-')[1] as Key
					if (key === 'amount') {
						const actInput = document.getElementById(id) as HTMLInputElement
						const actFormatted = actInput.parentElement!
							.childNodes[2] as HTMLDivElement
						actInput.classList.remove(s.error_shake)
						actFormatted.classList.remove(s.error_shake)
					} else {
						document.getElementById(id)!.classList.remove(s.error_shake)
					}
				})
				node.classList.remove(s.error_shake, s.error)
			})
		} else {
			setSubmitting(true)
			try {
				await insertTransactionAndItems(formData)
				setSubmitting(false)
			} catch (e) {
				if (isStandardError(e)) {
					promptError(
						'Error occurred while creating your transaction.',
						e.message,
						'Check your internet connection, and try refreshing the page.'
					)
					console.error(e)
				}
			}
		}
	}

	return (
		<div className={s.main}>
			<h2>Create New Transaction</h2>
			<form>
				<div className={s.split_col}>
					<div className={s.name_container}>
						<label htmlFor='transaction-name'>Name:</label>
						<JInput
							id='transaction-name'
							onChange={handleChange}
							value={formData.name}
							ref={firstFocusRef}
						/>
					</div>
					<div className={s.date_container}>
						<label htmlFor='transaction-date'>Date:</label>
						<JDatePicker
							id='transaction-date'
							onChange={handleChange}
							value={formData.date}
						/>
					</div>
				</div>
				<div className={s.multiple_toggle_container}>
					<label htmlFor='multiple-items'>Multiple Items?</label>
					<JCheckbox
						bgColor='var(--popup-bg-color)'
						id='multiple-items'
						checked={isMultiItems}
						onChange={(e) => setIsMultiItems(e.target.checked)}
					/>
				</div>
				{isMultiItems ? (
					<MultiItemGrid
						{...{ formData, handleChange, dropdownOptions, setFormData }}
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
			<div className={s.button_container}>
				<JButton jstyle='secondary'>Go Back</JButton>
				<JButton
					jstyle={missingItems.length !== 0 ? 'secondary' : 'primary'}
					onClick={handleSubmit}
					loading={submitting}
					ref={lastFocusRef}
				>
					Create
				</JButton>
			</div>
		</div>
	)
}
