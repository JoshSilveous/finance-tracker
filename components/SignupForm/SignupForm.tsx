import { ChangeEvent, FormEvent, useState } from 'react'
import { signup } from './signup'
import s from './SignupForm.module.scss'
import { JInput } from '../JForm/JInput/JInput'
import { JButton } from '../JForm/JButton/JButton'

interface Errors {
	email: string
	password: string
	password_confirm: string
	general: string
}

export function SignupForm() {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		password_confirm: '',
	})
	const [errors, setErrors] = useState<Errors>({
		email: '',
		password: '',
		password_confirm: '',
		general: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value,
		})
		setErrors((prev) => ({ ...prev, [name]: '' }))
	}
	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()

		setErrors({
			email: '',
			password: '',
			password_confirm: '',
			general: '',
		})
		let formValid = true

		// email is blank
		if (formData.email === '') {
			setErrors((prev) => ({
				...prev,
				email: 'You must enter an email',
			}))
			formValid = false
		}

		// email isn't formatted properly
		if (!/@.*\./.test(formData.email) && formData.email !== '') {
			setErrors((prev) => ({
				...prev,
				email: `Email isn't in proper format`,
			}))
			formValid = false
		}

		// password is blank
		if (formData.password === '') {
			setErrors((prev) => ({
				...prev,
				password: 'You must enter a password',
			}))
			formValid = false
		}

		let passwordIsAtLeast8Chars = true
		let passwordHasUppercase = true
		let passwordHasLowercase = true
		let passwordHasNumber = true

		// password doesn't meet length requirement
		if (!/.{8,}/.test(formData.password)) {
			passwordIsAtLeast8Chars = false
		}

		// password doesn't have an uppercase character
		if (!/[A-Z]/.test(formData.password)) {
			passwordHasUppercase = false
		}

		// password doesn't have a lowercase character
		if (!/[a-z]/.test(formData.password)) {
			passwordHasLowercase = false
		}

		// password doesn't have a number
		if (!/\d/.test(formData.password)) {
			passwordHasNumber = false
		}

		if (
			!passwordIsAtLeast8Chars ||
			!passwordHasUppercase ||
			!passwordHasLowercase ||
			!passwordHasNumber
		) {
			const errorsTxt: string[] = []

			if (!passwordIsAtLeast8Chars) {
				errorsTxt.push('at least 8 characters')
			}
			if (!passwordHasUppercase) {
				errorsTxt.push('an uppercase character')
			}
			if (!passwordHasLowercase) {
				errorsTxt.push('a lowercase character')
			}
			if (!passwordHasNumber) {
				errorsTxt.push('a number')
			}
			setErrors((prev) => ({
				...prev,
				password: `Password needs ${errorsTxt.slice(0, -1).join(', ')}${
					errorsTxt.length > 1 ? ', and ' : ''
				}${errorsTxt.slice(-1)}`,
			}))
			formValid = false
		}

		if (formData.password !== formData.password_confirm) {
			// passwords don't match
			setErrors((prev) => ({
				...prev,
				password_confirm: 'Passwords do not match',
			}))
			formValid = false
		}

		if (formValid) {
			setIsSubmitting(true)
			const res = await signup(formData.email, formData.password)
			if (res?.error) {
				setErrors((prev) => ({ ...prev, general: res.error }))
				setIsSubmitting(false)
			}
		}

		console.log(formData)
	}
	return (
		<form className={s.form} onSubmit={handleSubmit} noValidate>
			<div className={errors.email ? s.error : ''}>
				<label htmlFor='email'>Email</label>
				<JInput
					id='email'
					name='email'
					type='email'
					required
					onChange={handleInputChange}
				/>
				<div className={s.error_container}>
					{errors.email && <div>{errors.email}</div>}
				</div>
			</div>
			<div className={errors.password ? s.error : ''}>
				<label htmlFor='password'>Password</label>
				<JInput
					id='password'
					name='password'
					type='password'
					required
					onChange={handleInputChange}
				/>
				<div className={s.error_container}>
					{errors.password && <div>{errors.password}</div>}
				</div>
			</div>
			<div className={errors.password_confirm ? s.error : ''}>
				<label htmlFor='password_confirm'>Password Confirm</label>
				<JInput
					id='password_confirm'
					name='password_confirm'
					type='password'
					required
					onChange={handleInputChange}
				/>
				<div className={s.error_container}>
					{errors.password_confirm && <div>{errors.password_confirm}</div>}
				</div>
			</div>
			<div>
				<JButton jstyle='primary' type='submit'>
					{isSubmitting ? 'Loading...' : 'Sign up'}
				</JButton>
				<div className={s.error_container}>
					{errors.general && <div>{errors.general}</div>}
				</div>
			</div>
		</form>
	)
}
