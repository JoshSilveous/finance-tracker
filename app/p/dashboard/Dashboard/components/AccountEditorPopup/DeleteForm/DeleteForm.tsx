import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import { ChangeEvent, ChangeEventHandler, useEffect, useRef, useState } from 'react'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import { fetchAccountData, getAccountCountAssocWithTransaction } from '@/database'
import { JButton } from '@/components/JForm'
import {
	addCommas,
	promptError,
	createPopup,
	isStandardError,
	clearFocusLoop,
	createFocusLoop,
} from '@/utils'
import { default as LoadingIcon } from '@/public/loading.svg'
import { AccountItem, DeleteActItem } from '../AccountEditorPopup'

interface DeleteFormProps {
	account_name: string
	account_id: string
	closePopup: () => void
	handleConfirm: (item: DeleteActItem) => void
	actData: AccountItem[]
	deletedAccounts: DeleteActItem[]
}
export function DeleteForm({
	account_name,
	account_id,
	handleConfirm,
	closePopup,
	actData,
	deletedAccounts,
}: DeleteFormProps) {
	// this'll be redone at some point
	const [deleteMethod, setDeleteMethod] = useState<DeleteActItem['method']>()
	const [otherAccounts, setOtherAccounts] = useState<{ name: string; id: string }[]>()
	const [readyToConfirm, setReadyToConfirm] = useState(false)
	const [accountToChangeTo, setAccountToChangeTo] = useState<string>()
	const [associatedTransactionCount, setAssociatedTransactionCount] = useState<number>()

	const firstNodeRef = useRef<HTMLInputElement | HTMLButtonElement>(null)
	const lastNodeRef = useRef<HTMLButtonElement>(null)
	useEffect(() => {
		let clearLoops = () => {}
		if (firstNodeRef.current && lastNodeRef.current) {
			clearFocusLoop(firstNodeRef.current, lastNodeRef.current)
			const loop = createFocusLoop(firstNodeRef.current, lastNodeRef.current)
			if (loop) {
				clearLoops = loop.clearLoops
			}
		}
		return () => {
			clearLoops()
		}
	}, [firstNodeRef.current, lastNodeRef.current, deleteMethod, associatedTransactionCount])

	const firstLoadRef = useRef(false)
	useEffect(() => {
		if (firstNodeRef.current && !firstLoadRef.current) {
			firstLoadRef.current = true
			firstNodeRef.current.focus()
		}
	}, [firstLoadRef.current, firstNodeRef.current, associatedTransactionCount])

	useEffect(() => {
		getAccountCountAssocWithTransaction(account_id)
			.then((count) => {
				setAssociatedTransactionCount(count)
				setOtherAccounts(
					actData
						.map((it) => ({ name: it.name.val, id: it.id }))
						.filter((it) => it.id !== account_id)
				)
			})
			.catch((e) => {
				if (isStandardError(e)) {
					console.error(e)
					promptError(
						'An unexpected error has occurred while trying to fetch the transactions associated with this account:',
						e.message,
						'Try refreshing the page to resolve this issue.'
					)
					console.error(e.message)
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
		return (
			<div className={s.main}>
				<h1>Delete "{account_name}"</h1>
				<div className={`${s.content} ${s.zero_transactions}`}>
					<p>
						There are <strong>0</strong> transactions associated with this
						account. Are you sure you want to delete "{account_name}"?
					</p>
					<div className={s.warning}>THIS CANNOT BE UNDONE</div>
				</div>
				<div className={s.button_container}>
					<JButton
						jstyle='secondary'
						onClick={closePopup}
						ref={firstNodeRef as React.RefObject<HTMLButtonElement>}
					>
						Go Back
					</JButton>
					<JButton
						jstyle='primary'
						className={s.confirm_button}
						onClick={() => {
							handleConfirm({ id: account_id, method: 'delete' })
							closePopup()
						}}
						ref={lastNodeRef}
					>
						Confirm
					</JButton>
				</div>
			</div>
		)
	} else {
		const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
			const selectedMethod = e.target.id as DeleteActItem['method']
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
		const handleDropdownChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
			if (e.target.value === '') {
				setReadyToConfirm(false)
				setAccountToChangeTo(undefined)
			} else {
				setReadyToConfirm(true)
				setAccountToChangeTo(e.target.value)
			}
		}

		const handleConfirmClick = () => {
			if (deleteMethod === 'replace') {
				handleConfirm({
					id: account_id,
					method: 'replace',
					new_id: accountToChangeTo!,
				})
			} else {
				handleConfirm({ id: account_id, method: deleteMethod! })
			}

			closePopup()
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
								is <strong>1</strong> transaction item{' '}
							</>
						) : (
							<>
								are{' '}
								<strong>{addCommas(`${associatedTransactionCount}`)}</strong>{' '}
								transaction items{' '}
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
							ref={firstNodeRef as React.RefObject<HTMLInputElement>}
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
				</div>
				<div className={s.button_container}>
					<JButton
						jstyle='secondary'
						onClick={closePopup}
						ref={readyToConfirm ? undefined : lastNodeRef}
					>
						Go Back
					</JButton>
					<JButton
						jstyle='primary'
						className={s.confirm_button}
						disabled={!readyToConfirm}
						onClick={handleConfirmClick}
						ref={readyToConfirm ? lastNodeRef : undefined}
					>
						Confirm
					</JButton>
				</div>
			</div>
		)
	}
}
