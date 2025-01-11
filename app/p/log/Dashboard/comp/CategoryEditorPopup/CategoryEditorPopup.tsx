import { ChangeEvent, useEffect, useRef, useState } from 'react'
import s from './CategoryEditorPopup.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as InsertRowIcon } from '@/public/insert_row.svg'
import { fetchCategoryData } from '@/database'
import { JButton, JInput } from '@/components/JForm'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { createFocusLoop, delay, moveItemInArray } from '@/utils'
import { handleReorder } from './handleReorder'

interface NewCategoryManagerPopupProps {
	closePopup: () => void
}
export function CategoryEditorPopup({ closePopup }: NewCategoryManagerPopupProps) {
	const [isLoading, setIsLoading] = useState(true)
	const [catData, setCatData] = useState<CategoryItem[]>([])
	const defCatData = useRef<CategoryItem[]>([])
	const [sortOrder, setSortOrder] = useState<string[]>([])
	const defSortOrder = useRef<string[]>([])

	const itemRowRefs = useRef<ItemRowsRef>({})

	const addToItemRowRefs =
		<T extends keyof ItemRowsRef[string]>(category_id: string, key: T) =>
		(node: ItemRowsRef[string][T] | null) => {
			if (itemRowRefs.current[category_id] === undefined) {
				itemRowRefs.current[category_id] = {
					[key]: node || undefined,
				} as ItemRowsRef[string]
			} else {
				itemRowRefs.current[category_id][key] = node || undefined
			}
		}

	const lastNodeRef = useRef<HTMLButtonElement>(null)
	useEffect(() => {
		if (
			sortOrder &&
			itemRowRefs.current[sortOrder[0]] &&
			itemRowRefs.current[sortOrder[0]].deleteButton &&
			lastNodeRef.current
		) {
			createFocusLoop(
				itemRowRefs.current[sortOrder[0]].deleteButton!,
				lastNodeRef.current
			)
		}
	})

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
	}

	useEffect(() => {
		refreshData()
	}, [])

	const areChanges = (() => {
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

	const handleInputChange =
		(category_id: string) => (e: ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value
			setCatData((prev) => {
				const clone = structuredClone(prev)
				const index = clone.findIndex((entry) => entry.id === category_id)
				clone[index].name.val = val
				clone[index].name.changed = defCatData.current[index].name.val !== val
				return clone
			})
		}

	const applyReorder = (oldIndex: number, newIndex: number) => {
		setSortOrder((prev) => {
			const clone = structuredClone(prev)
			moveItemInArray(clone, oldIndex, newIndex)
			return clone
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
				>
					<div
						className={`${s.cell} ${s.control} ${
							defSortIndex !== sortIndex && s.changed
						}`}
					>
						<div className={s.delete_container}>
							<JButton
								jstyle='invisible'
								ref={addToItemRowRefs(cat.id, 'deleteButton')}
							>
								<DeleteIcon />
							</JButton>
						</div>
						<div className={s.reorder_container}>
							<JButton
								jstyle='invisible'
								ref={addToItemRowRefs(cat.id, 'reorderButton')}
								onMouseDown={(e) =>
									handleReorder(
										cat.id,
										itemRowRefs,
										sortOrder,
										sortIndex,
										e,
										applyReorder
									)
								}
							>
								<ReorderIcon />
							</JButton>
						</div>
					</div>
					<div className={`${s.cell} ${s.name} ${cat.name.changed && s.changed}`}>
						<JInput
							value={cat.name.val}
							onChange={handleInputChange(cat.id)}
							ref={addToItemRowRefs(cat.id, 'nameInput')}
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
					if (itemRowRefs.current[tempID]) {
						const input = itemRowRefs.current[tempID].nameInput!
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
				>
					Save
				</JButton>
			</div>
		</div>
	)
}

type CategoryItem = { id: string; name: { val: string; changed: boolean } }

export type ItemRowsRef = {
	[category_id: string]: {
		container?: HTMLDivElement
		nameInput?: HTMLInputElement
		deleteButton?: HTMLButtonElement
		reorderButton?: HTMLButtonElement
	}
}
