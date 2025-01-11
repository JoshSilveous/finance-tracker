import { ChangeEvent, useEffect, useRef, useState } from 'react'
import s from './CategoryEditorPopup.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as InsertRowIcon } from '@/public/insert_row.svg'
import { fetchCategoryData } from '@/database'
import { JButton, JInput } from '@/components/JForm'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { createFocusLoop, createPopup, delay } from '@/utils'

interface NewCategoryManagerPopupProps {
	closePopup: () => void
}
export function CategoryEditorPopup({ closePopup }: NewCategoryManagerPopupProps) {
	const [isLoading, setIsLoading] = useState(true)
	const [catData, setCatData] = useState<CategoryItem[]>([])
	const defCatData = useRef<CategoryItem[]>([])
	const [sortOrder, setSortOrder] = useState<string[]>([])
	const defSortOrder = useRef<string[]>([])

	type ItemRowsRef = { [category_id: string]: HTMLDivElement }
	const itemRowRefs = useRef<ItemRowsRef>({})
	const addToItemRowRefs = (category_id: string) => (node: HTMLDivElement) => {
		itemRowRefs.current[category_id] = node
	}
	useEffect(() => {
		if (sortOrder) {
			const topCatID = sortOrder[0]
			itemRowRefs.current[topCatID]
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
		console.log('itemRowRefs', itemRowRefs)
	})
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

			const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
				const val = e.target.value
				console.log('val:', val)
				setCatData((prev) => {
					const clone = structuredClone(prev)
					const index = clone.findIndex((entry) => entry.id === cat.id)
					clone[index].name.val = val
					clone[index].name.changed = defCatData.current[index].name.val !== val
					return clone
				})
			}

			return (
				<div style={{ display: 'contents' }} ref={addToItemRowRefs(cat.id)}>
					<div
						className={`${s.cell} ${s.control} ${
							defSortIndex !== sortIndex && s.changed
						}`}
					>
						<div className={s.delete_container}>
							<JButton jstyle='invisible'>
								<DeleteIcon />
							</JButton>
						</div>
						<div className={s.reorder_container}>
							<JButton jstyle='invisible'>
								<ReorderIcon />
							</JButton>
						</div>
					</div>
					<div className={`${s.cell} ${s.name} ${cat.name.changed && s.changed}`}>
						<JInput value={cat.name.val} onChange={handleInputChange} />
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
						const input = itemRowRefs.current[tempID].children[1].children[0]
							.children[0] as HTMLInputElement
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
				<JButton jstyle='secondary' onClick={closePopup}>
					Go Back
				</JButton>
				<JButton jstyle='primary' disabled={!areChanges}>
					Save
				</JButton>
			</div>
		</div>
	)
}

type CategoryItem = { id: string; name: { val: string; changed: boolean } }
