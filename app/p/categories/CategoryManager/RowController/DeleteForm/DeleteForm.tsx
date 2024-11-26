import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import { ChangeEvent, useEffect, useState } from 'react'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import {
	deleteCategoryAndTransactions,
	deleteCategoryAndReplace,
	deleteCategoryAndSetNull,
	fetchCategoryData,
	getCategoryCountAssocWithTransaction,
} from '@/database'
import { JButton } from '@/components/JForm'
import { addCommas, promptError, createPopup, isStandardError } from '@/utils'
import { default as LoadingIcon } from '@/public/loading.svg'

interface DeleteFormProps {
	category_name: string
	category_id: string
	afterDelete: () => void
}
type DeleteMethods = 'delete' | 'set_null' | 'replace'
export function DeleteForm({ category_name, category_id, afterDelete }: DeleteFormProps) {
	const [deleteMethod, setDeleteMethod] = useState<DeleteMethods>()
	const [otherCategories, setOtherCategories] = useState<{ name: string; id: string }[]>()
	const [readyToConfirm, setReadyToConfirm] = useState(false)
	const [categoryToChangeTo, setCategoryToChangeTo] = useState<string>()
	const [associatedTransactionCount, setAssociatedTransactionCount] = useState<number>()

	useEffect(() => {
		Promise.all([getCategoryCountAssocWithTransaction(category_id), fetchCategoryData()])
			.then((values) => {
				const count = values[0]
				const categories = values[1]
				setAssociatedTransactionCount(count)
				setOtherCategories(
					categories
						.filter((category) => category.id !== category_id)
						.map((category) => ({ name: category.name, id: category.id }))
				)
			})
			.catch((e) => {
				if (isStandardError(e)) {
					promptError(
						'An unexpected error has occurred while trying to fetch the transactions associated with this category:',
						e.message,
						'Try refreshing the page to resolve this issue.'
					)
				} else {
					console.error(e)
				}
			})
	}, [])

	if (associatedTransactionCount === undefined) {
		return (
			<div className={s.main}>
				<h1>Delete "{category_name}"</h1>
				<div className={`${s.content} ${s.loading}`}>
					<LoadingIcon />
				</div>
			</div>
		)
	} else if (associatedTransactionCount === 0) {
		const handleConfirm = () => {
			deleteCategoryAndTransactions(category_id)
				.then(() => {
					afterDelete()
				})
				.catch((e) => {
					if (isStandardError(e)) {
						afterDelete()
						promptError(
							'An unexpected error has occurred while deleting this category:',
							e.message,
							'Try refreshing the page to resolve this issue.'
						)
					} else {
						console.error(e)
					}
				})
		}
		return (
			<div className={s.main}>
				<h1>Delete "{category_name}"</h1>
				<div className={`${s.content} ${s.zero_transactions}`}>
					<p>
						There are <strong>0</strong> transactions associated with this
						category. Are you sure you want to delete "{category_name}"?
					</p>
					<div className={s.warning}>THIS CANNOT BE UNDONE</div>
					<ConfirmButton onClick={handleConfirm} />
				</div>
			</div>
		)
	} else {
		const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
			const selectedMethod = e.target.id as DeleteMethods
			setDeleteMethod(selectedMethod)
			setReadyToConfirm(true)
			setCategoryToChangeTo(undefined)
			if (selectedMethod === 'replace') {
				setReadyToConfirm(false)
				setCategoryToChangeTo(undefined)
				if (otherCategories !== undefined) {
				}
			}
		}
		const handleDropdownChange: JDropdownTypes.ChangeEventHandler = (e) => {
			if (e.target.value === '') {
				setReadyToConfirm(false)
				setCategoryToChangeTo(undefined)
			} else {
				setReadyToConfirm(true)
				setCategoryToChangeTo(e.target.value)
			}
		}
		const handleConfirm = () => {
			let confirmMessage = <></>
			let newCategoryName: string | undefined = undefined
			if (deleteMethod === 'replace') {
				newCategoryName = otherCategories!.find(
					(act) => act.id === categoryToChangeTo
				)!.name
			}
			switch (deleteMethod) {
				case 'delete':
					confirmMessage = (
						<p>
							Are you sure you want to delete <strong>{category_name}</strong>{' '}
							and any transactions associated with it?
						</p>
					)
					break
				case 'set_null':
					confirmMessage = (
						<p>
							Are you sure you want to delete <strong>{category_name}</strong>{' '}
							and set the category attribute of associated transactions to
							Empty?
						</p>
					)
					break
				case 'replace':
					confirmMessage = (
						<p>
							Are you sure you want to delete <strong>{category_name}</strong>{' '}
							and set the category attribute of associated transactions to{' '}
							<strong>{newCategoryName!}</strong>?
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
						<ConfirmButton onClick={handleConfirm} />
					</div>
				</div>
			)
			myPopup.trigger()

			function handleConfirm() {
				switch (deleteMethod) {
					case 'delete':
						deleteCategoryAndTransactions(category_id)
							.then(() => {
								myPopup.close()
								afterDelete()
							})
							.catch((e) => {
								if (isStandardError(e)) {
									myPopup.close()
									afterDelete()
									promptError(
										"An unexpected error has occurred while deleting this category and it's associated transactions:",
										e.message,
										'Try refreshing the page to resolve this issue.'
									)
								} else {
									console.error(e)
								}
							})
						break
					case 'set_null':
						deleteCategoryAndSetNull(category_id)
							.then(() => {
								myPopup.close()
								afterDelete()
							})
							.catch((e) => {
								if (isStandardError(e)) {
									myPopup.close()
									afterDelete()
									promptError(
										"An unexpected error has occurred while deleting this category and setting it's associated transactions to empty:",
										e.message,
										'Try refreshing the page to resolve this issue.'
									)
								} else {
									console.error(e)
								}
							})
						break
					case 'replace':
						deleteCategoryAndReplace(category_id, categoryToChangeTo!)
							.then(() => {
								myPopup.close()
								afterDelete()
							})
							.catch((e) => {
								if (isStandardError(e)) {
									myPopup.close()
									afterDelete()
									promptError(
										"An unexpected error has occurred while deleting this category and replacing the category of it's associated transactions:",
										e.message,
										'Try refreshing the page to resolve this issue.'
									)
								} else {
									console.error(e)
								}
							})
						break
				}
			}
		}
		return (
			<div className={s.main}>
				<h1>Delete "{category_name}"</h1>
				<div
					className={`${s.content} ${s.has_transactions} ${
						otherCategories!.length === 0 ? s.no_other_categories : ''
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
						associated with this category. How would you like to handle those
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
							Keep the transactions, and set their category attribute to Empty.
						</JRadio>
						{otherCategories!.length !== 0 && (
							<JRadio
								id='replace'
								name='handle_delete'
								onChange={handleRadioChange}
							>
								Keep the transactions, and change their category attribute to
								a different category.
							</JRadio>
						)}
					</div>
					{deleteMethod === 'replace' && (
						<div className={s.replace_dropdown}>
							<p>Choose an category to replace "{category_name}" with:</p>
							<JDropdown
								options={
									otherCategories !== undefined
										? otherCategories.map((item) => ({
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
function ConfirmButton({ onClick }: { onClick: () => void }) {
	const [isProcessing, setIsProcessing] = useState(false)
	return (
		<JButton
			onClick={() => {
				setIsProcessing(true)
				onClick()
			}}
			jstyle='primary'
			loading={isProcessing}
		>
			Confirm
		</JButton>
	)
}
