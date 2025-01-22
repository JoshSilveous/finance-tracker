import { JRadio } from '@/components/JForm/JRadio/JRadio'
import s from './DeleteForm.module.scss'
import {
	ChangeEvent,
	ChangeEventHandler,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import {
	fetchCategoryData,
	getCategoryCountAssocWithTransaction,
	reportErrorToDB,
} from '@/database'
import { JButton } from '@/components/JForm'
import {
	addCommas,
	promptError,
	createPopup,
	isStandardError,
	createFocusLoop,
	clearFocusLoop,
} from '@/utils'
import { default as LoadingIcon } from '@/public/loading.svg'
import { CategoryItem, DeleteCatItem } from '../CategoryEditorPopup'

interface DeleteFormProps {
	category_name: string
	category_id: string
	closePopup: () => void
	handleConfirm: (item: DeleteCatItem) => void
	catData: CategoryItem[]
	deletedCategories: DeleteCatItem[]
}
export function DeleteForm({
	category_name,
	category_id,
	handleConfirm,
	closePopup,
	catData,
	deletedCategories,
}: DeleteFormProps) {
	// this'll be redone at some point
	const [deleteMethod, setDeleteMethod] = useState<DeleteCatItem['method']>()
	const [otherCategories, setOtherCategories] = useState<{ name: string; id: string }[]>()
	const [readyToConfirm, setReadyToConfirm] = useState(false)
	const [categoryToChangeTo, setCategoryToChangeTo] = useState<string>()
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
		getCategoryCountAssocWithTransaction(category_id)
			.then((count) => {
				setAssociatedTransactionCount(count)
				setOtherCategories(
					catData
						.map((it) => ({ name: it.name.val, id: it.id }))
						.filter((it) => it.id !== category_id)
				)
			})
			.catch((e) => {
				reportErrorToDB(e as Error)
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
				<h1>Delete &quot;{category_name}&quot;</h1>
				<div className={`${s.content} ${s.loading}`}>
					<LoadingIcon />
				</div>
			</div>
		)
	} else if (associatedTransactionCount === 0) {
		return (
			<div className={s.main}>
				<h1>Delete &quot;{category_name}&quot;</h1>
				<div className={`${s.content} ${s.zero_transactions}`}>
					<p>
						There are <strong>0</strong> transactions associated with this
						category. Are you sure you want to delete &quot;{category_name}
						&quot;?
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
							handleConfirm({ id: category_id, method: 'delete' })
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
			if (deleteMethod === 'replace') {
				handleConfirm({
					id: category_id,
					method: 'replace',
					new_id: categoryToChangeTo!,
				})
			} else {
				handleConfirm({ id: category_id, method: deleteMethod! })
			}

			closePopup()
		}

		return (
			<div className={s.main}>
				<h1>Delete &quot;{category_name}&quot;</h1>
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
							ref={firstNodeRef as React.RefObject<HTMLInputElement>}
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
							<p>
								Choose an category to replace &quot;{category_name}&quot;
								with:
							</p>
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
