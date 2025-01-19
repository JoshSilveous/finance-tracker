import { ChangeEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import s from './AccountEditorPopup.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import {
	deleteAccountAndSetNull,
	deleteAccountAndReplace,
	deleteAccountAndTransactions,
	fetchAccountData,
	insertAccounts,
	upsertAccounts,
	UpsertAccountEntry,
	reportErrorToDB,
} from '@/database'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import {
	createFocusLoop,
	createPopup,
	delay,
	isStandardError,
	moveItemInArray,
	promptError,
} from '@/utils'
import { handleReorder } from './func/handleReorder'
import { DeleteForm } from './DeleteForm/DeleteForm'
import { saveChanges } from './func/saveChanges'

interface NewAccountManagerPopupProps {
	closePopup: () => void
	refreshAllData: () => Promise<void>
}
export function AccountEditorPopup({
	closePopup,
	refreshAllData,
}: NewAccountManagerPopupProps) {
	const [isLoading, setIsLoading] = useState(true)
	const [actData, setActData] = useState<AccountItem[]>([])
	const defActData = useRef<AccountItem[]>([])
	const [sortOrder, setSortOrder] = useState<string[]>([])
	const [deletedAccounts, setDeletedAccounts] = useState<DeleteActItem[]>([])
	const [isSaving, setIsSaving] = useState(false)
	const defSortOrder = useRef<string[]>([])

	const actRowsRef = useRef<ActRowsRef>({})
	const createButtonRef = useRef<HTMLButtonElement>(null)

	const addToItemRowRefs =
		<T extends keyof ActRowsRef[string]>(account_id: string, key: T) =>
		(node: ActRowsRef[string][T] | null) => {
			if (actRowsRef.current[account_id] === undefined) {
				actRowsRef.current[account_id] = {
					[key]: node || undefined,
				} as ActRowsRef[string]
			} else {
				actRowsRef.current[account_id][key] = node || undefined
			}
		}

	const lastNodeRef = useRef<HTMLButtonElement>(null)
	useEffect(() => {
		if (
			sortOrder &&
			actRowsRef.current[sortOrder[0]] &&
			actRowsRef.current[sortOrder[0]].deleteButton &&
			lastNodeRef.current
		) {
			createFocusLoop(
				actRowsRef.current[sortOrder[0]].deleteButton!,
				lastNodeRef.current
			)
		}
	})

	const firstLoadRef = useRef(false)
	useLayoutEffect(() => {
		if (firstLoadRef.current && !isLoading) {
			if (actData.length) {
				actRowsRef.current[sortOrder[0]].nameInput!.focus()
			} else {
				createButtonRef.current!.focus()
			}
		}
	}, [firstLoadRef.current])

	const refreshData = async () => {
		setIsLoading(true)
		const fetchedData = await fetchAccountData()
		const mapped = fetchedData.map((act) => ({
			name: { val: act.name, changed: false },
			starting_amount: { val: act.starting_amount.toFixed(2), changed: false },
			id: act.id,
		}))
		setActData(mapped)
		defActData.current = mapped
		const fetchedSortOrder = fetchedData.map((act) => act.id)
		setSortOrder(fetchedSortOrder)
		defSortOrder.current = fetchedSortOrder
		setIsLoading(false)
		if (!firstLoadRef.current) {
			firstLoadRef.current = true
		}
	}

	useEffect(() => {
		refreshData()
	}, [])

	const updateVal = (account_id: string, key: 'name' | 'starting_amount', val: string) => {
		setActData((prev) => {
			const clone = structuredClone(prev)
			const index = clone.findIndex((it) => it.id === account_id)
			clone[index][key].val = val
			clone[index][key].changed = defActData.current[index]
				? defActData.current[index][key].val !== val
				: true
			return clone
		})
	}

	const areChanges = (() => {
		if (deletedAccounts.length > 0) {
			return true
		}
		if (actData.length !== defActData.current.length) {
			return true
		}
		if (actData.some((act) => act.name.changed)) {
			return true
		}
		if (
			sortOrder.some(
				(sortItem, sortIndex) => sortItem !== defSortOrder.current[sortIndex]
			)
		) {
			return true
		}
		return false
	})()

	const applyReorder = (oldIndex: number, newIndex: number) => {
		const thisTransactionID = sortOrder[oldIndex]
		setSortOrder((prev) => {
			const clone = structuredClone(prev)
			moveItemInArray(clone, oldIndex, newIndex)
			return clone
		})
		delay(5).then(() => {
			actRowsRef.current[thisTransactionID] &&
				actRowsRef.current[thisTransactionID].reorderButton!.focus()
		})
	}

	let grid = <></>
	if (!isLoading) {
		const headers: JGridTypes.Header[] = [
			{
				content: <div className={`${s.cell} ${s.control_header}`}></div>,
				defaultWidth: 60,
				noResize: true,
			},
			{
				content: (
					<div className={`${s.cell} ${s.name_header}`}>
						<div className={s.header}>Name</div>
					</div>
				),
				defaultWidth: 100,
			},
			{
				content: (
					<div className={`${s.cell} ${s.starting_amount_header}`}>
						<div className={s.header}>Starting Amount</div>
					</div>
				),
				defaultWidth: 65,
				minWidth: 65,
				maxWidth: 80,
			},
		]

		const cells = sortOrder.map((sortItem, sortIndex) => {
			const act = actData.find((act) => act.id === sortItem)!
			const defSortIndex = defSortOrder.current.indexOf(sortItem)

			return (
				<div
					style={{ display: 'contents' }}
					ref={addToItemRowRefs(act.id, 'container')}
					key={sortIndex}
				>
					<div
						className={`${s.cell} ${s.control} ${
							defSortIndex !== sortIndex ? s.changed : ''
						}`}
					>
						<div className={s.delete_container}>
							<JButton
								jstyle='invisible'
								ref={addToItemRowRefs(act.id, 'deleteButton')}
								onClick={() => {
									if (act.id.startsWith('PENDING_CREATION')) {
										setDeletedAccounts((prev) => {
											const clone = structuredClone(prev)
											return clone.filter((it) => it.new_id !== act.id)
										})
										setActData((prev) => {
											const clone = structuredClone(prev)
											return clone.filter((it) => it.id !== act.id)
										})
										setSortOrder((prev) => {
											const clone = structuredClone(prev)
											return clone.filter((it) => it !== act.id)
										})
									} else {
										const refocus = () => {
											if (lastNodeRef.current) {
												lastNodeRef.current.focus()
											}
										}
										const popup = createPopup({
											content: (
												<DeleteForm
													account_id={act.id}
													actData={actData}
													deletedAccounts={deletedAccounts}
													account_name={act.name.val}
													closePopup={() => {
														popup.close()
														refocus()
													}}
													handleConfirm={(item: DeleteActItem) => {
														setDeletedAccounts((prev) => {
															const clone =
																structuredClone(prev)
															clone.push(item)
															return clone
														})
														setSortOrder((prev) => {
															const clone =
																structuredClone(prev)
															clone.splice(
																clone.indexOf(item.id),
																1
															)
															return clone
														})
														setActData((prev) => {
															const clone =
																structuredClone(prev)
															clone.splice(
																clone.findIndex(
																	(it) => it.id === item.id
																),
																1
															)
															return clone
														})
														refocus()
													}}
												/>
											),
											handleClose: refocus,
										})
										popup.trigger()
									}
								}}
							>
								<DeleteIcon />
							</JButton>
						</div>
						<div className={s.reorder_container}>
							<JButton
								jstyle='invisible'
								ref={addToItemRowRefs(act.id, 'reorderButton')}
								onMouseDown={(e) => {
									if (window.getSelection()) {
										window.getSelection()!.removeAllRanges()
									}
									handleReorder(
										act.id,
										actRowsRef,
										sortOrder,
										sortIndex,
										e,
										applyReorder
									)
								}}
							>
								<ReorderIcon />
							</JButton>
						</div>
					</div>
					<div
						className={`${s.cell} ${s.name} ${
							act.name.changed ? s.changed : ''
						}`}
					>
						<JInput
							value={act.name.val}
							onChange={(e) => updateVal(act.id, 'name', e.target.value)}
							ref={addToItemRowRefs(act.id, 'nameInput')}
							placeholder={
								defActData.current[defSortIndex]
									? defActData.current[defSortIndex].name.val
									: undefined
							}
							onBlur={(e) => {
								const value = e.target.value
								const trimmed = value.trim()
								if (value !== trimmed) {
									e.target.value = trimmed
									updateVal(act.id, 'name', trimmed)
								}
							}}
						/>
					</div>
					<div
						className={`${s.cell} ${s.starting_amount} ${
							act.starting_amount.changed ? s.changed : ''
						}`}
					>
						<JNumberAccounting
							value={act.starting_amount.val}
							onChange={(e) =>
								updateVal(act.id, 'starting_amount', e.target.value)
							}
							ref={addToItemRowRefs(act.id, 'startingAmountInput')}
							placeholder={
								defActData.current[defSortIndex]
									? defActData.current[defSortIndex].starting_amount.val
									: undefined
							}
						/>
					</div>
				</div>
			)
		})

		const newAccountRow = (() => {
			const createNewAccount = () => {
				const tempID = 'PENDING_CREATION||' + crypto.randomUUID()

				setActData((prev) => {
					const clone = structuredClone(prev)
					clone.push({
						name: { val: '', changed: true },
						starting_amount: { val: '0.00', changed: true },
						id: tempID,
					})
					return clone
				})
				setSortOrder((prev) => {
					const clone = structuredClone(prev)
					clone.push(tempID)
					return clone
				})
				delay(10).then(() => {
					if (actRowsRef.current[tempID]) {
						const input = actRowsRef.current[tempID].nameInput!
						input.focus()
					}
				})
			}

			return (
				<div style={{ display: 'contents' }}>
					<div className={`${s.cell} ${s.new_button_container}`}>
						<JButton
							jstyle='primary'
							onClick={createNewAccount}
							ref={createButtonRef}
						>
							Create New Account
						</JButton>
					</div>
				</div>
			)
		})()

		cells.push(newAccountRow)

		grid = <JGrid cells={cells} headers={headers} useFullWidth noBorders stickyHeaders />
	}

	const handleSave = async () => {
		setIsSaving(true)

		try {
			await saveChanges(actData, sortOrder, deletedAccounts, defSortOrder)
		} catch (e) {
			reportErrorToDB(e as Error)
			if (isStandardError(e)) {
				promptError(
					'An unexpected error has occurred while propagating table layout preferences in the database:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
				console.error(e.message)
			}
		}

		setIsSaving(false)
		refreshAllData()
		closePopup()
		const actEditorPopup = createPopup({
			content: (
				<AccountEditorPopup
					closePopup={() => {
						actEditorPopup.close()
					}}
					refreshAllData={refreshAllData}
				/>
			),
		})
		actEditorPopup.trigger()
	}

	return (
		<div className={s.main}>
			<h2>Account Editor</h2>
			<div className={s.grid_container}>
				{isLoading ? (
					<div className={s.loading_anim_container}>
						<LoadingAnim />
					</div>
				) : (
					grid
				)}
			</div>
			<div className={s.button_container}>
				<JButton
					jstyle='secondary'
					onClick={closePopup}
					ref={areChanges ? undefined : lastNodeRef}
				>
					Go Back
				</JButton>
				<JButton
					jstyle='primary'
					disabled={!areChanges}
					ref={areChanges ? lastNodeRef : undefined}
					onClick={handleSave}
					loading={isSaving}
				>
					Save
				</JButton>
			</div>
		</div>
	)
}

export type DeleteActItem = {
	id: string
	method: 'delete' | 'set_null' | 'replace'
	new_id?: string
}

export type AccountItem = {
	id: string
	name: { val: string; changed: boolean }
	starting_amount: { val: string; changed: boolean }
}

export type ActRowsRef = {
	[account_id: string]: {
		container?: HTMLDivElement
		nameInput?: HTMLInputElement
		startingAmountInput?: HTMLInputElement
		deleteButton?: HTMLButtonElement
		reorderButton?: HTMLButtonElement
	}
}
