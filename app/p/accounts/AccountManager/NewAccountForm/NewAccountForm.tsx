import { JButton } from '@/components/JForm/JButton/JButton'
import s from './NewAccountForm.module.scss'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { JInput } from '@/components/JForm/JInput/JInput'
import JNumberAccounting from '@/components/JForm/JNumberAccounting/JNumberAccounting'
import { insertAccount } from '../clientFunctions'
import { isStandardError } from '@/utils/errors/isStandardError'

interface Errors {
	name: string
	starting_amount: string
	general: string
}

export function NewAccountForm({ afterSubmit }: { afterSubmit: () => void }) {
	const [formData, setFormData] = useState({ name: '', starting_amount: '' })
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

		// check that "starting_amount" isn't blank
		if (formData.starting_amount === '') {
			setErrors((prev) => ({
				...prev,
				starting_amount: 'You must enter a starting balance',
			}))
			formValid = false
		}

		if (formValid) {
			setIsSubmitting(true)

			try {
				await insertAccount(formData.name.trim(), formData.starting_amount)
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

	useEffect(() => {
		console.log(formData)
	}, [formData])

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
						required
						onChange={handleInputChange}
						onBlur={handleBlur}
						placeholder='0.00'
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
