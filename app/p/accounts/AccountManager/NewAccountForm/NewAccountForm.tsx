import { JButton } from '@/components/JForm'
import s from './NewAccountForm.module.scss'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { JInput, JNumberAccounting } from '@/components/JForm'
import { insertAccount, InsertAccountEntry } from '@/database'
import { isStandardError } from '@/utils'

interface Errors {
	name: string
	starting_amount: string
	general: string
}

export function NewAccountForm({ afterSubmit }: { afterSubmit: () => void }) {
	const [formData, setFormData] = useState<InsertAccountEntry>({
		name: '',
		starting_amount: 0,
	})
	const [errors, setErrors] = useState<Errors>({
		name: '',
		starting_amount: '',
		general: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()

		setErrors({
			name: '',
			starting_amount: '',
			general: '',
		})

		let formValid = true

		// check that "name" isn't blank
		if (formData.name === '') {
			setErrors((prev) => ({
				...prev,
				name: 'You must enter an account name',
			}))
			formValid = false
		}

		if (formValid) {
			setIsSubmitting(true)
			const newAccount: InsertAccountEntry = {
				name: formData.name.trim(),
				starting_amount: formData.starting_amount,
			}

			try {
				await insertAccount(newAccount)
				afterSubmit()
			} catch (e) {
				if (isStandardError(e)) {
					setErrors((prev) => ({
						...prev,
						general: e.message,
					}))
				}
			}
		}
	}

	function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
		e.target.value = e.target.value.trimStart()

		let { name, value } = e.target
		if (name === 'starting_amount') {
			value = parseFloat(value).toFixed(2)
		}
		setFormData({
			...formData,
			[name]: value,
		})
		setErrors((prev) => ({ ...prev, [name]: '' }))
	}

	function handleBlur(e: ChangeEvent<HTMLInputElement>) {
		let { name, value } = e.target
		e.target.value = value.trim()
		setFormData({
			...formData,
			[name]: value.trim(),
		})
	}

	return (
		<div>
			<h1>Create New Account</h1>
			<form className={s.form} onSubmit={handleSubmit} noValidate>
				<div className={errors.name ? s.error : ''}>
					<label htmlFor='name'>Account Name</label>
					<JInput
						id='name'
						name='name'
						type='text'
						required
						onChange={handleInputChange}
						onBlur={handleBlur}
						placeholder='e.x. Discover Credit'
						value={formData.name}
					/>
					<div className={s.error_container}>
						{errors.name && <div>{errors.name}</div>}
					</div>
				</div>
				<div className={errors.starting_amount ? s.error : ''}>
					<label htmlFor='starting_amount'>Starting Amount</label>
					<JNumberAccounting
						id='starting_amount'
						name='starting_amount'
						className={s.accounting_input}
						required
						onChange={handleInputChange}
						onBlur={handleBlur}
						value={formData.starting_amount}
					/>
					<div className={s.error_container}>
						{errors.starting_amount && <div>{errors.starting_amount}</div>}
					</div>
				</div>
				<div>
					<JButton jstyle='primary' type='submit' loading={isSubmitting}>
						Create Account
					</JButton>
					<div className={s.error_container}>
						{errors.general && <div>{errors.general}</div>}
					</div>
				</div>
			</form>
		</div>
	)
}
