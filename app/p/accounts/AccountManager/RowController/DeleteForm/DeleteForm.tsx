import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import { ChangeEvent, useEffect, useState } from 'react'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { fetchData } from '../../func'

interface DeleteFormProps {
	account_name: string
	account_id: string
	afterDelete: () => void
}
type DeleteMethods = 'delete' | 'set_null' | 'replace'
export function DeleteForm({ account_name, account_id, afterDelete }: DeleteFormProps) {
	const [deleteMethod, setDeleteMethod] = useState<DeleteMethods>()
	const [otherAccounts, setOtherAccounts] = useState<{ name: string; id: string }[]>()
	const [accountsAreLoaded, setAccountsAreLoaded] = useState(false)

	async function fetchAccounts() {
		const data = await fetchData()
		console.log('loaded:', data)
		setOtherAccounts(
			data
				.filter((thisData) => thisData.id !== account_id)
				.map((item) => ({ name: item.name, id: item.id }))
		)
		setAccountsAreLoaded(true)
	}

	function handleRadioChange(e: ChangeEvent<HTMLInputElement>) {
		const selectedMethod = e.target.id as DeleteMethods
		setDeleteMethod(selectedMethod)
		if (selectedMethod === 'replace' && !accountsAreLoaded) {
			console.log('loading accounts')
			fetchAccounts()
		}
	}
	const handleDropdownChange: JDropdownTypes.ChangeEventHandler = (e) => {
		console.log('deleteform level', e.target.value)
	}
	console.log('accountsAreLoaded', accountsAreLoaded, 'otherAccounts', otherAccounts)
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
			{deleteMethod === 'replace' && (
				<div className={s.replace_dropdown}>
					<p>Choose an account to replace "{account_name}" with:</p>
					<JDropdown
						options={
							accountsAreLoaded
								? otherAccounts!.map((item) => ({
										name: item.name,
										value: item.id,
								  }))
								: []
						}
						onChange={handleDropdownChange}
						loading={!accountsAreLoaded}
					/>
				</div>
			)}
		</div>
	)
}
