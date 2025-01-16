import { ChangeEvent, Dispatch, SetStateAction, useRef } from 'react'
import s from './TutorialCategoryEditor.module.scss'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { JButton, JInput } from '@/components/JForm'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { delay, moveItemInArray } from '@/utils'
import { handleReorder } from './func/handleReorder'

interface NewCategoryManagerPopupProps {
	catData: CategoryItem[]
	setCatData: Dispatch<SetStateAction<CategoryItem[]>>
}
export function TutorialCategoryEditor({
	catData,
	setCatData,
}: NewCategoryManagerPopupProps) {
	const catRowRefs = useRef<CatRowsRef>({})

	const addToCatRowRefs =
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

	const updateVal = (category_id: string, val: string) => {
		setCatData((prev) => {
			const clone = structuredClone(prev)
			const index = clone.findIndex((it) => it.id === category_id)
			clone[index].name = val
			return clone
		})
	}

	const handleInputBlur = (category_id: string) => (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		const trimmed = value.trim()
		if (value !== trimmed) {
			e.target.value = trimmed
			updateVal(category_id, trimmed)
		}
	}

	const applyReorder = (oldIndex: number, newIndex: number) => {
		let thisTransactionID = ''
		setCatData((prev) => {
			const clone = structuredClone(prev)
			thisTransactionID = clone[oldIndex].id
			moveItemInArray(clone, oldIndex, newIndex)
			return clone
		})
		delay(5).then(() => {
			catRowRefs.current[thisTransactionID] &&
				catRowRefs.current[thisTransactionID].reorderButton!.focus()
		})
	}

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

	const cells = catData.map((cat, index) => {
		return (
			<div
				style={{ display: 'contents' }}
				ref={addToCatRowRefs(cat.id, 'container')}
				key={`${index}-${index}`}
			>
				<div className={`${s.cell} ${s.control}`}>
					<div className={s.delete_container}>
						<JButton
							jstyle='invisible'
							ref={addToCatRowRefs(cat.id, 'deleteButton')}
							onClick={() => {
								setCatData((prev) => {
									const clone = structuredClone(prev)
									return clone.filter((it) => it.id !== cat.id)
								})
							}}
						>
							<DeleteIcon />
						</JButton>
					</div>
					<div className={s.reorder_container}>
						<JButton
							jstyle='invisible'
							ref={addToCatRowRefs(cat.id, 'reorderButton')}
							onMouseDown={(e) => {
								if (window.getSelection()) {
									window.getSelection()!.removeAllRanges()
								}
								handleReorder(cat.id, catRowRefs, index, e, applyReorder)
							}}
						>
							<ReorderIcon />
						</JButton>
					</div>
				</div>
				<div className={`${s.cell} ${s.name}`}>
					<JInput
						value={cat.name}
						onChange={(e) => updateVal(cat.id, e.target.value)}
						ref={addToCatRowRefs(cat.id, 'nameInput')}
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
				clone.push({ name: '', id: tempID })
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

	return (
		<div className={s.main}>
			<h2>Category Editor</h2>
			<div className={s.grid_container}>
				<JGrid
					cells={cells}
					headers={headers}
					useFullWidth
					noBorders
					stickyHeaders
				/>
			</div>
		</div>
	)
}

export type CategoryItem = { id: string; name: string }

export type CatRowsRef = {
	[category_id: string]: {
		container?: HTMLDivElement
		nameInput?: HTMLInputElement
		deleteButton?: HTMLButtonElement
		reorderButton?: HTMLButtonElement
	}
}
