import { JButton } from '@/components/JForm'
import s from './NewCategoryForm.module.scss'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { JInput, JNumberAccounting } from '@/components/JForm'
import { insertCategory, InsertCategoryEntry } from '@/database'
import { isStandardError } from '@/utils'

interface Errors {
	name: string
	general: string
}

export function NewCategoryForm({ afterSubmit }: { afterSubmit: () => void }) {
	const [formData, setFormData] = useState<InsertCategoryEntry>({ name: '' })
	const [errors, setErrors] = useState<Errors>({
		name: '',
		general: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()

		setErrors({
			name: '',
			general: '',
		})

		let formValid = true

		// check that "name" isn't blank
		if (formData.name === '') {
			setErrors((prev) => ({
				...prev,
				name: 'You must enter an category name',
			}))
			formValid = false
		}

		if (formValid) {
			setIsSubmitting(true)
			const newCategory: InsertCategoryEntry = {
				name: formData.name.trim(),
			}

			try {
				await insertCategory(newCategory)
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
			<h1>Create New Category</h1>
			<form className={s.form} onSubmit={handleSubmit} noValidate>
				<div className={errors.name ? s.error : ''}>
					<label htmlFor='name'>Category Name</label>
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
