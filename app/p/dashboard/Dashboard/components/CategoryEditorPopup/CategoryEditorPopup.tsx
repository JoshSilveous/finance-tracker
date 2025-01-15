import { ChangeEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import s from './CategoryEditorPopup.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import {
	deleteAccountAndSetNull,
	deleteCategoryAndReplace,
	deleteCategoryAndSetNull,
	deleteCategoryAndTransactions,
	fetchCategoryData,
	insertCategory,
	reportErrorToDB,
	upsertCategories,
	UpsertCategoryEntry,
} from '@/database'
import { JButton, JInput } from '@/components/JForm'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import {
	createFocusLoop,
	createPopup,
	delay,
	errToObj,
	isStandardError,
	moveItemInArray,
	promptError,
} from '@/utils'
import { handleReorder } from './func/handleReorder'
import { DeleteForm } from './DeleteForm/DeleteForm'
import { saveChanges } from './func/saveChanges'

interface NewCategoryManagerPopupProps {
	closePopup: () => void
	refreshAllData: () => Promise<void>
}
export function CategoryEditorPopup({
	closePopup,
	refreshAllData,
}: NewCategoryManagerPopupProps) {
	const [isLoading, setIsLoading] = useState(true)
	const [catData, setCatData] = useState<CategoryItem[]>([])
	const defCatData = useRef<CategoryItem[]>([])
	const [sortOrder, setSortOrder] = useState<string[]>([])
	const [deletedCategories, setDeletedCategories] = useState<DeleteCatItem[]>([])
	const [isSaving, setIsSaving] = useState(false)
	const defSortOrder = useRef<string[]>([])

	const catRowRefs = useRef<CatRowsRef>({})

	const addToItemRowRefs =
		<T extends keyof CatRowsRef[string]>(category_id: string, key: T) =>
		(node: CatRowsRef[string][T] | null) => {
			if (catRowRefs.current[category_id] === undefined) {
				catRowRefs.current[category_id] = {
					[key]: node || undefined,
				} as CatRowsRef[string]
			} else {
				catRowRefs.current[category_id][key] = node || undefined
			}
		}

	const lastNodeRef = useRef<HTMLButtonElement>(null)
	useEffect(() => {
		if (
			sortOrder &&
			catRowRefs.current[sortOrder[0]] &&
			catRowRefs.current[sortOrder[0]].deleteButton &&
			lastNodeRef.current
		) {
			createFocusLoop(
				catRowRefs.current[sortOrder[0]].deleteButton!,
				lastNodeRef.current
			)
		}
	})
	const firstLoadRef = useRef(false)
	useLayoutEffect(() => {
		if (firstLoadRef.current && !isLoading) {
			catRowRefs.current[sortOrder[0]].nameInput!.focus()
		}
	}, [firstLoadRef.current])

	const refreshData = async () => {
		setIsLoading(true)
		const fetchedData = await fetchCategoryData()
		const mapped = fetchedData.map((cat) => ({
			name: { val: cat.name, changed: false },
			id: cat.id,
		}))
		setCatData(mapped)
		defCatData.current = mapped
		const fetchedSortOrder = fetchedData.map((cat) => cat.id)
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

	const updateVal = (category_id: string, val: string) => {
		setCatData((prev) => {
			const clone = structuredClone(prev)
			const index = clone.findIndex((it) => it.id === category_id)
			clone[index].name.val = val
			clone[index].name.changed = defCatData.current[index]
				? defCatData.current[index].name.val !== val
				: true
			return clone
		})
	}

	const areChanges = (() => {
		if (deletedCategories.length > 0) {
			return true
		}
		if (catData.length !== defCatData.current.length) {
			return true
		}
		if (catData.some((cat) => cat.name.changed)) {
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

	const handleInputBlur = (category_id: string) => (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		const trimmed = value.trim()
		if (value !== trimmed) {
			e.target.value = trimmed
			updateVal(category_id, trimmed)
		}
	}

	const applyReorder = (oldIndex: number, newIndex: number) => {
		const thisTransactionID = sortOrder[oldIndex]
		setSortOrder((prev) => {
			const clone = structuredClone(prev)
			moveItemInArray(clone, oldIndex, newIndex)
			return clone
		})
		delay(5).then(() => {
			catRowRefs.current[thisTransactionID] &&
				catRowRefs.current[thisTransactionID].reorderButton!.focus()
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
				defaultWidth: 80,
			},
		]

		const cells = sortOrder.map((sortItem, sortIndex) => {
			const cat = catData.find((cat) => cat.id === sortItem)!
			const defSortIndex = defSortOrder.current.indexOf(sortItem)

			return (
				<div
					style={{ display: 'contents' }}
					ref={addToItemRowRefs(cat.id, 'container')}
					key={`${sortIndex}-${sortIndex}`}
				>
					<div
						className={`${s.cell} ${s.control} ${
							defSortIndex !== sortIndex ? s.changed : ''
						}`}
					>
						<div className={s.delete_container}>
							<JButton
								jstyle='invisible'
								ref={addToItemRowRefs(cat.id, 'deleteButton')}
								onClick={() => {
									if (cat.id.startsWith('PENDING_CREATION')) {
										setDeletedCategories((prev) => {
											const clone = structuredClone(prev)
											return clone.filter((it) => it.new_id !== cat.id)
										})
										setCatData((prev) => {
											const clone = structuredClone(prev)
											return clone.filter((it) => it.id !== cat.id)
										})
										setSortOrder((prev) => {
											const clone = structuredClone(prev)
											return clone.filter((it) => it !== cat.id)
										})
									} else {
										const refocus = () => {
											if (lastNodeRef.current) {
												lastNodeRef.current.focus()
											}
										}
										const popup = createPopup(
											<DeleteForm
												category_id={cat.id}
												catData={catData}
												deletedCategories={deletedCategories}
												category_name={cat.name.val}
												closePopup={() => {
													popup.close()
													refocus()
												}}
												handleConfirm={(item: DeleteCatItem) => {
													setDeletedCategories((prev) => {
														const clone = structuredClone(prev)
														clone.push(item)
														return clone
													})
													setSortOrder((prev) => {
														const clone = structuredClone(prev)
														clone.splice(
															clone.indexOf(item.id),
															1
														)
														return clone
													})
													setCatData((prev) => {
														const clone = structuredClone(prev)
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
											/>,
											undefined,
											refocus
										)
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
								ref={addToItemRowRefs(cat.id, 'reorderButton')}
								onMouseDown={(e) => {
									if (window.getSelection()) {
										window.getSelection()!.removeAllRanges()
									}
									handleReorder(
										cat.id,
										catRowRefs,
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
							cat.name.changed ? s.changed : ''
						}`}
					>
						<JInput
							value={cat.name.val}
							onChange={(e) => updateVal(cat.id, e.target.value)}
							ref={addToItemRowRefs(cat.id, 'nameInput')}
							placeholder={
								defCatData.current[defSortIndex]
									? defCatData.current[defSortIndex].name.val
									: undefined
							}
							onBlur={handleInputBlur(cat.id)}
						/>
					</div>
				</div>
			)
		})

		const newCategoryRow = (() => {
			const createNewCategory = () => {
				const tempID = 'PENDING_CREATION||' + crypto.randomUUID()

				setCatData((prev) => {
					const clone = structuredClone(prev)
					clone.push({ name: { val: '', changed: true }, id: tempID })
					return clone
				})
				setSortOrder((prev) => {
					const clone = structuredClone(prev)
					clone.push(tempID)
					return clone
				})
				delay(10).then(() => {
					if (catRowRefs.current[tempID]) {
						const input = catRowRefs.current[tempID].nameInput!
						input.focus()
					}
				})
			}

			return (
				<div style={{ display: 'contents' }}>
					<div className={`${s.cell} ${s.new_button_container}`}>
						<JButton jstyle='primary' onClick={createNewCategory}>
							Create New Category
						</JButton>
					</div>
				</div>
			)
		})()

		cells.push(newCategoryRow)

		grid = <JGrid cells={cells} headers={headers} useFullWidth noBorders stickyHeaders />
	}

	const handleSave = async () => {
		setIsSaving(true)

		try {
			await saveChanges(catData, sortOrder, deletedCategories, defSortOrder)
		} catch (e) {
			reportErrorToDB(e as Error)
			if (isStandardError(e)) {
				promptError(
					'An unexpected error has occurred while saving your changes:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
				console.error(e.message)
			}
		}

		setIsSaving(false)
		refreshAllData()
		closePopup()
		const catEditorPopup = createPopup(
			<CategoryEditorPopup
				closePopup={() => {
					catEditorPopup.close()
				}}
				refreshAllData={refreshAllData}
			/>
		)
		catEditorPopup.trigger()
	}

	return (
		<div className={s.main}>
			<h2>Category Editor</h2>
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

export type DeleteCatItem = {
	id: string
	method: 'delete' | 'set_null' | 'replace'
	new_id?: string
}

export type CategoryItem = { id: string; name: { val: string; changed: boolean } }

export type CatRowsRef = {
	[category_id: string]: {
		container?: HTMLDivElement
		nameInput?: HTMLInputElement
		deleteButton?: HTMLButtonElement
		reorderButton?: HTMLButtonElement
	}
}
