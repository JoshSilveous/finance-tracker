import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import { ChangeEvent, useEffect, useState } from 'react'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { fetchData } from '../../func'
import { JButton } from '@/components/JForm'
import { createPopup } from '@/utils'

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
	const [readyToConfirm, setReadyToConfirm] = useState(false)
	const [accountToChangeTo, setAccountToChangeTo] = useState<string>()

	function handleRadioChange(e: ChangeEvent<HTMLInputElement>) {
		const selectedMethod = e.target.id as DeleteMethods
		setDeleteMethod(selectedMethod)
		setReadyToConfirm(true)
		setAccountToChangeTo(undefined)
		if (selectedMethod === 'replace') {
			setReadyToConfirm(false)
			setAccountToChangeTo(undefined)
			if (!accountsAreLoaded) {
				fetchData().then((data) => {
					setOtherAccounts(
						data
							.filter((thisData) => thisData.id !== account_id)
							.map((item) => ({ name: item.name, id: item.id }))
					)
					setAccountsAreLoaded(true)
				})
			}
		}
	}
	const handleDropdownChange: JDropdownTypes.ChangeEventHandler = (e) => {
		if (e.target.value === '') {
			setReadyToConfirm(false)
			setAccountToChangeTo(undefined)
		} else {
			setReadyToConfirm(true)
			setAccountToChangeTo(e.target.value)
		}
	}
	function handleConfirm() {
		console.log('deleteMethod:', deleteMethod)
		if (deleteMethod === 'replace') {
			console.log('replacing with', accountToChangeTo)
		}

		let confirmMessage = <></>
		switch (deleteMethod) {
			case 'delete':
				confirmMessage = (
					<p>
						Are you sure you want to delete <strong>{account_name}</strong> and
						any transactions associated with it?
					</p>
				)
				break
			case 'set_null':
				confirmMessage = (
					<p>
						Are you sure you want to delete <strong>{account_name}</strong> and
						set the account attribute of associated transactions to Empty?
					</p>
				)
				break
			case 'replace':
				const newAccountName = otherAccounts!.find(
					(act) => act.id === accountToChangeTo
				)!.name
				console.log(newAccountName)
				confirmMessage = (
					<p>
						Are you sure you want to delete <strong>{account_name}</strong> and
						set the account attribute of associated transactions to{' '}
						<strong>{newAccountName}</strong>?
					</p>
				)
				break
		}

		const myPopup = createPopup(<div className={s.confirm_popup}>{confirmMessage}</div>)
		myPopup.trigger()
	}
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
			<JButton
				jstyle='primary'
				className={s.confirm_button}
				disabled={!readyToConfirm}
				onClick={handleConfirm}
			>
				Confirm
			</JButton>
		</div>
	)
}
