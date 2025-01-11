import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import { ChangeEvent, ChangeEventHandler, useEffect, useState } from 'react'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import { fetchCategoryData, getCategoryCountAssocWithTransaction } from '@/database'
import { JButton } from '@/components/JForm'
import { addCommas, promptError, createPopup, isStandardError } from '@/utils'
import { default as LoadingIcon } from '@/public/loading.svg'
import { DeleteCatItem } from '../CategoryEditorPopup'

interface DeleteFormProps {
	category_name: string
	category_id: string
	closePopup: () => void
	handleConfirm: (item: DeleteCatItem) => void
}
export function DeleteForm({
	category_name,
	category_id,
	handleConfirm,
	closePopup,
}: DeleteFormProps) {
	// this'll be redone at some point
	const [deleteMethod, setDeleteMethod] = useState<DeleteCatItem['method']>()
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
					console.error(e)
					promptError(
						'An unexpected error has occurred while trying to fetch the transactions associated with this category:',
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
				<h1>Delete "{category_name}"</h1>
				<div className={`${s.content} ${s.loading}`}>
					<LoadingIcon />
				</div>
			</div>
		)
	} else if (associatedTransactionCount === 0) {
		return (
			<div className={s.main}>
				<h1>Delete "{category_name}"</h1>
				<div className={`${s.content} ${s.zero_transactions}`}>
					<p>
						There are <strong>0</strong> transactions associated with this
						category. Are you sure you want to delete "{category_name}"?
					</p>
					<div className={s.warning}>THIS CANNOT BE UNDONE</div>
				</div>
				<div className={s.button_container}>
					<JButton jstyle='secondary' onClick={closePopup}>
						Go Back
					</JButton>
					<JButton
						jstyle='primary'
						className={s.confirm_button}
						disabled={!readyToConfirm}
						onClick={() => {
							handleConfirm({ id: category_id, method: 'delete' })
							closePopup()
						}}
					>
						Confirm
					</JButton>
				</div>
			</div>
		)
	} else {
		const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
			const selectedMethod = e.target.id as DeleteCatItem['method']
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
		const handleDropdownChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
			if (e.target.value === '') {
				setReadyToConfirm(false)
				setCategoryToChangeTo(undefined)
			} else {
				setReadyToConfirm(true)
				setCategoryToChangeTo(e.target.value)
			}
		}
		const handleConfirmClick = () => {
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
						<JButton onClick={handleConfirmClick} jstyle='primary'>
							Confirm
						</JButton>
					</div>
				</div>
			)
			myPopup.trigger()

			function handleConfirmClick() {
				if (deleteMethod === 'replace') {
					handleConfirm({
						id: category_id,
						method: 'replace',
						new_id: categoryToChangeTo!,
					})
				} else {
					handleConfirm({ id: category_id, method: deleteMethod! })
				}

				myPopup.close()
				closePopup()
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
								is <strong>1</strong> transaction item{' '}
							</>
						) : (
							<>
								are{' '}
								<strong>{addCommas(`${associatedTransactionCount}`)}</strong>{' '}
								transaction items{' '}
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
				</div>
				<div className={s.button_container}>
					<JButton jstyle='secondary' onClick={closePopup}>
						Go Back
					</JButton>
					<JButton
						jstyle='primary'
						className={s.confirm_button}
						disabled={!readyToConfirm}
						onClick={handleConfirmClick}
					>
						Confirm
					</JButton>
				</div>
			</div>
		)
	}
}
