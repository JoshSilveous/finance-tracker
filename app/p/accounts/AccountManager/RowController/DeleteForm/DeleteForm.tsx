import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import { ChangeEvent, useState } from 'react'

interface DeleteFormProps {
	account_name: string
	account_id: string
	afterDelete: () => void
}
type DeleteMethods = 'delete' | 'set_null' | 'replace'
export function DeleteForm({ account_name, account_id, afterDelete }: DeleteFormProps) {
	const [deleteMethod, setDeleteMethod] = useState<DeleteMethods>()
	function handleRadioChange(e: ChangeEvent<HTMLInputElement>) {
		const selectedMethod = e.target.id as DeleteMethods
		setDeleteMethod(selectedMethod)
	}
	console.log('deleteMethod', deleteMethod)
	return (
		<div className={s.main}>
			<h1>Delete "{account_name}"</h1>
			<p>
				There are x transactions associated with this account. How would you like to
				handle those transactions?
			</p>
			<div className={s.radio_options}>
				<JRadio id='delete' name='handle_delete' onChange={handleRadioChange}>
					Delete the transactions
				</JRadio>
				<JRadio id='set_null' name='handle_delete' onChange={handleRadioChange}>
					Keep the transactions, and set their account attribute to Empty.
				</JRadio>
				<JRadio id='replace' name='handle_delete' onChange={handleRadioChange}>
					Keep the transactions, and change their account attribute to a different
					account.
				</JRadio>
			</div>
		</div>
	)
}