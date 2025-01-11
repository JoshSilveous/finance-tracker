import { useState } from 'react'
import s from './CreateCategoryPopup.module.scss'
import { JButton, JInput } from '@/components/JForm'

interface CreateCategoryPopupProps {
	closePopup: () => void
	afterSuccess: () => void
}
export function CreateCategoryPopup({ closePopup, afterSuccess }: CreateCategoryPopupProps) {
	const [val, setVal] = useState('')

	return (
		<div className={s.main}>
			<h3>Create New Category</h3>
			<div className={s.form}>
				<label htmlFor='new_cat_name'>Name:</label>
				<JInput
					id='new_cat_name'
					value={val}
					onChange={(e) => setVal(e.target.value)}
					placeholder='e.x. Food, Rent, Gas'
				/>
			</div>
			<div className={s.button_container}>
				<JButton jstyle='secondary' onClick={closePopup}>
					Go Back
				</JButton>
				<JButton jstyle='primary' onClick={createCategory}>
					Go Back
				</JButton>
			</div>
		</div>
	)
}
