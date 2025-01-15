'use client'
import { ChangeEvent, FormEvent, useState } from 'react'
import { login } from './login'
import s from './LoginForm.module.scss'
import { JButton, JInput } from '../../../components/JForm'
import { createClient } from '@/database/supabase/client'

interface Errors {
	email: string
	password: string
	general: string
}

const supabase = createClient()

export function LoginForm() {
	const [formData, setFormData] = useState({ email: '', password: '' })
	const [errors, setErrors] = useState<Errors>({
		email: '',
		password: '',
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

		if (formValid) {
			setIsSubmitting(true)
			const res = await login(formData.email, formData.password)

			if (res?.error) {
				setErrors((prev) => ({ ...prev, general: res.error }))
				setIsSubmitting(false)
			}
		}
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
					disabled={isSubmitting}
				/>
				<div className={s.error_container}>
					{errors.password && <div>{errors.password}</div>}
				</div>
			</div>
			<div>
				<JButton jstyle='primary' type='submit' loading={isSubmitting}>
					Sign In
				</JButton>
				<div className={s.error_container}>
					{errors.general && <div>{errors.general}</div>}
				</div>
			</div>
		</form>
	)
}
