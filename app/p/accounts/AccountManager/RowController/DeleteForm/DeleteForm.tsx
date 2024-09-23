import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import { ChangeEvent, useEffect, useState } from 'react'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import {
	deleteAccountAndTransactions,
	deleteAccountAndReplace,
	deleteAccountAndSetNull,
	fetchData,
	getAssociatedTransactionCount,
} from '../../func'
import { JButton } from '@/components/JForm'
import { addCommas, createErrorPopup, createPopup, isStandardError } from '@/utils'
import { default as LoadingIcon } from '@/public/loading.svg'

interface DeleteFormProps {
	account_name: string
	account_id: string
	afterDelete: () => void
	forceClose: () => void
}
type DeleteMethods = 'delete' | 'set_null' | 'replace'
export function DeleteForm({
	account_name,
	account_id,
	afterDelete,
	forceClose,
}: DeleteFormProps) {
	const [deleteMethod, setDeleteMethod] = useState<DeleteMethods>()
	const [otherAccounts, setOtherAccounts] = useState<{ name: string; id: string }[]>()
	const [readyToConfirm, setReadyToConfirm] = useState(false)
	const [accountToChangeTo, setAccountToChangeTo] = useState<string>()
	const [associatedTransactionCount, setAssociatedTransactionCount] = useState<number>()

	useEffect(() => {
		Promise.all([getAssociatedTransactionCount(account_id), fetchData()])
			.then((values) => {
				const count = values[0]
				const accounts = values[1]
				setAssociatedTransactionCount(421)
				setOtherAccounts(
					accounts
						.filter((account) => account.id !== account_id)
						.map((account) => ({ name: account.name, id: account.id }))
				)
			})
			.catch((e) => {
				if (isStandardError(e)) {
					createErrorPopup(e.message)
				} else {
					console.error(e)
				}
			})
	}, [])

	if (associatedTransactionCount === undefined) {
		return (
			<div className={s.main}>
				<h1>Delete "{account_name}"</h1>
				<div className={`${s.content} ${s.loading}`}>
					<LoadingIcon />
				</div>
			</div>
		)
	} else if (associatedTransactionCount === 0) {
		const handleConfirm = () => {
			deleteAccountAndTransactions(account_id)
				.then(() => {
					forceClose()
					afterDelete()
				})
				.catch((e) => {
					if (isStandardError(e)) {
						forceClose()
						afterDelete()
						createErrorPopup(e.message)
					} else {
						console.error(e)
					}
				})
		}
		return (
			<div className={s.main}>
				<h1>Delete "{account_name}"</h1>
				<div className={`${s.content} ${s.zero_transactions}`}>
					<p>
						There are <strong>0</strong> transactions associated with this
						account. Are you sure you want to delete "{account_name}"?
					</p>
					<div className={s.warning}>THIS CANNOT BE UNDONE</div>
					<JButton
						jstyle='primary'
						className={s.confirm_button}
						onClick={handleConfirm}
					>
						Confirm
					</JButton>
				</div>
			</div>
		)
	} else {
		const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
			const selectedMethod = e.target.id as DeleteMethods
			setDeleteMethod(selectedMethod)
			setReadyToConfirm(true)
			setAccountToChangeTo(undefined)
			if (selectedMethod === 'replace') {
				setReadyToConfirm(false)
				setAccountToChangeTo(undefined)
				if (otherAccounts !== undefined) {
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
		const handleConfirm = () => {
			console.log('deleteMethod:', deleteMethod)
			if (deleteMethod === 'replace') {
				console.log('replacing with', accountToChangeTo)
			}

			let confirmMessage = <></>
			let newAccountName: string | undefined = undefined
			if (deleteMethod === 'replace') {
				newAccountName = otherAccounts!.find(
					(act) => act.id === accountToChangeTo
				)!.name
			}
			switch (deleteMethod) {
				case 'delete':
					confirmMessage = (
						<p>
							Are you sure you want to delete <strong>{account_name}</strong>{' '}
							and any transactions associated with it?
						</p>
					)
					break
				case 'set_null':
					confirmMessage = (
						<p>
							Are you sure you want to delete <strong>{account_name}</strong>{' '}
							and set the account attribute of associated transactions to
							Empty?
						</p>
					)
					break
				case 'replace':
					confirmMessage = (
						<p>
							Are you sure you want to delete <strong>{account_name}</strong>{' '}
							and set the account attribute of associated transactions to{' '}
							<strong>{newAccountName!}</strong>?
						</p>
					)
					break
			}

			const myPopup = createPopup(
				<div className={s.confirm_popup}>
					{confirmMessage}
					<div className={s.warning}>THIS CANNOT BE UNDONE</div>
					<div className={s.button_container}>
						<JButton
							onClick={() => {
								myPopup.close()
							}}
							jstyle='secondary'
						>
							Go Back
						</JButton>
						<JButton onClick={handleConfirm} jstyle='primary'>
							Confirm
						</JButton>
					</div>
				</div>
			)
			myPopup.trigger()

			function handleConfirm() {
				switch (deleteMethod) {
					case 'delete':
						deleteAccountAndTransactions(account_id)
							.then(() => {
								forceClose()
								afterDelete()
							})
							.catch((e) => {
								if (isStandardError(e)) {
									forceClose()
									afterDelete()
									createErrorPopup(e.message)
								} else {
									console.error(e)
								}
							})
						break
					case 'set_null':
						deleteAccountAndSetNull(account_id)
							.then(() => {
								forceClose()
								afterDelete()
							})
							.catch((e) => {
								if (isStandardError(e)) {
									forceClose()
									afterDelete()
									createErrorPopup(e.message)
								} else {
									console.error(e)
								}
							})
						break
					case 'replace':
						deleteAccountAndReplace(account_id, accountToChangeTo!)
							.then(() => {
								forceClose()
								afterDelete()
							})
							.catch((e) => {
								if (isStandardError(e)) {
									forceClose()
									afterDelete()
									createErrorPopup(e.message)
								} else {
									console.error(e)
								}
							})
						break
				}
				myPopup.close()
				forceClose()
				afterDelete()
			}
		}
		return (
			<div className={s.main}>
				<h1>Delete "{account_name}"</h1>
				<div
					className={`${s.content} ${s.has_transactions} ${
						otherAccounts!.length === 0 ? s.no_other_accounts : ''
					}`}
				>
					<p>
						There{' '}
						{associatedTransactionCount === 1 ? (
							<>
								is <strong>1</strong> transaction{' '}
							</>
						) : (
							<>
								are{' '}
								<strong>{addCommas(`${associatedTransactionCount}`)}</strong>{' '}
								transactions{' '}
							</>
						)}
						associated with this account. How would you like to handle those
						transactions?
					</p>
					<div className={s.radio_options}>
						<JRadio
							id='delete'
							name='handle_delete'
							onChange={handleRadioChange}
						>
							Delete the transactions
						</JRadio>
						<JRadio
							id='set_null'
							name='handle_delete'
							onChange={handleRadioChange}
						>
							Keep the transactions, and set their account attribute to Empty.
						</JRadio>
						{otherAccounts!.length !== 0 && (
							<JRadio
								id='replace'
								name='handle_delete'
								onChange={handleRadioChange}
							>
								Keep the transactions, and change their account attribute to
								a different account.
							</JRadio>
						)}
					</div>
					{deleteMethod === 'replace' && (
						<div className={s.replace_dropdown}>
							<p>Choose an account to replace "{account_name}" with:</p>
							<JDropdown
								options={
									otherAccounts !== undefined
										? otherAccounts.map((item) => ({
												name: item.name,
												value: item.id,
										  }))
										: []
								}
								onChange={handleDropdownChange}
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
			</div>
		)
	}
}
