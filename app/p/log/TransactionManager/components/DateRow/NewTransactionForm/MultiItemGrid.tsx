import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import { DropdownOptions } from '../../../TransactionManager'
import { TransactionFormData } from './NewTransactionForm'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './NewTransactionForm.module.scss'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { handleReorder } from './handleReorder'
import {
	addIsolatedKeyListeners,
	delay,
	IsolatedKeyListener,
	removeFromArray,
	removeIsolatedKeyListeners,
} from '@/utils'
import { useGridNav } from '../../../hooks'

interface MultiItemGridProps {
	formData: TransactionFormData
	handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>
	dropdownOptions: DropdownOptions
	setFormData: Dispatch<SetStateAction<TransactionFormData>>
}
export function MultiItemGrid({
	formData,
	handleChange,
	dropdownOptions,
	setFormData,
}: MultiItemGridProps) {
	const itemRowsRef = useRef<HTMLDivElement[]>([])
	const addToItemRowsRef = (itemIndex: number) => (node: HTMLDivElement) => {
		if (node !== null) {
			itemRowsRef.current[itemIndex] = node
		}
	}

	const gridNav = useGridNav(
		['MIG_controls', 'MIG_name', 'MIG_amount', 'MIG_category', 'MIG_account'],
		{
			loopAtEnd: true,
		}
	)
	useEffect(() => {
		const listeners: IsolatedKeyListener[] = [
			{
				context: 'NewTransactionForm',
				char: 'ENTER',
				ctrlKey: false,
				shiftKey: false,
				run: (e) => {
					if (gridNav.moveDown()) {
						e.preventDefault()
					}
				},
			},
			{
				context: 'NewTransactionForm',
				char: 'ENTER',
				ctrlKey: false,
				shiftKey: true,
				run: (e) => {
					if (gridNav.moveUp()) {
						e.preventDefault()
					}
				},
			},
		]
		addIsolatedKeyListeners(listeners)

		return () => {
			removeIsolatedKeyListeners(listeners)
		}
	})

	const addNewItem = useCallback(() => {
		setFormData((prev) => {
			const clone = structuredClone(prev)
			clone.items.push({ name: '', amount: '', category_id: '', account_id: '' })
			return clone
		})
		setNewItemAdded(true)
	}, [])
	const [newItemAdded, setNewItemAdded] = useState(false)
	useEffect(() => {
		// focus on new row when added
		if (newItemAdded) {
			const newRowNameInputNode = document.querySelector(
				`[data-newest-row-identifier="true"]`
			) as HTMLInputElement
			newRowNameInputNode.focus()
			setNewItemAdded(false)
		}
	}, [newItemAdded])

	const headers: JGridTypes.Header[] = useMemo(
		() => [
			{
				content: <div className={s.header_container} />,
				defaultWidth: 50,
				noResize: true,
			},
			{
				content: (
					<div className={`${s.header_container} ${s.first}`}>
						<div className={s.text}>Name</div>
					</div>
				),
				defaultWidth: 125,
				minWidth: 125,
				maxWidth: 175,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.text}>Amount</div>
					</div>
				),
				defaultWidth: 100,
				minWidth: 80,
				maxWidth: 150,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.text}>Category</div>
					</div>
				),
				defaultWidth: 100,
				minWidth: 80,
				maxWidth: 150,
			},
			{
				content: (
					<div className={`${s.header_container} ${s.last}`}>
						<div className={s.text}>Account</div>
					</div>
				),
				defaultWidth: 100,
				minWidth: 80,
				maxWidth: 150,
			},
		],
		[]
	)

	const deleteItem = useCallback(
		(index: number) => () => {
			setFormData((prev) => {
				const clone = structuredClone(prev)
				clone.items = removeFromArray(clone.items, index)
				return clone
			})
		},
		[]
	)

	let gridNavIndex = 0
	const cells: JGridTypes.Row[] = formData.items.map((item, index) => {
		const cell = (
			<div className={s.item_row} ref={addToItemRowsRef(index)} key={index}>
				<div className={`${s.control_container} ${index === 0 ? s.first_row : ''}`}>
					<div className={s.reorder_grabber}>
						<button
							type='button'
							onMouseDown={handleReorder(
								formData,
								setFormData,
								itemRowsRef.current,
								index
							)}
							disabled={formData.items.length === 1}
							title='Grab and drag to reposition this item'
							data-grid_nav_col='MIG_controls'
							data-grid_nav_index={gridNavIndex}
						>
							<ReorderIcon />
						</button>
					</div>
					<div className={s.delete_container}>
						<button
							type='button'
							disabled={formData.items.length === 1}
							title={
								formData.items.length !== 1
									? 'Save or discard changes before deleting'
									: ''
							}
							onClick={deleteItem(index)}
							data-grid_nav_col='MIG_controls'
							data-grid_nav_index={gridNavIndex}
						>
							<DeleteIcon />
						</button>
					</div>
				</div>
				<div className={`${s.cell} ${index === 0 ? s.first_row : ''}`}>
					<JInput
						id={`item-name-${index}`}
						data-newest-row-identifier={
							index === formData.items.length - 1 ? 'true' : undefined
						}
						value={item.name}
						onChange={handleChange}
						data-grid_nav_col='MIG_name'
						data-grid_nav_index={gridNavIndex}
					/>
				</div>
				<div className={`${s.cell} ${index === 0 ? s.first_row : ''}`}>
					<JNumberAccounting
						id={`item-amount-${index}`}
						value={item.amount}
						onChange={handleChange}
						data-grid_nav_col='MIG_amount'
						data-grid_nav_index={gridNavIndex}
					/>
				</div>
				<div className={`${s.cell} ${index === 0 ? s.first_row : ''}`}>
					<JDropdown
						id={`item-category_id-${index}`}
						options={dropdownOptions.category}
						value={item.category_id}
						onChange={handleChange}
						data-grid_nav_col='MIG_category'
						data-grid_nav_index={gridNavIndex}
					/>
				</div>
				<div className={`${s.cell} ${index === 0 ? s.first_row : ''}`}>
					<JDropdown
						id={`item-account_id-${index}`}
						options={dropdownOptions.account}
						value={item.account_id}
						onChange={handleChange}
						data-grid_nav_col='MIG_account'
						data-grid_nav_index={gridNavIndex}
					/>
				</div>
			</div>
		)
		gridNavIndex++
		return cell
	})
	cells.push(
		<div className={s.add_new_row}>
			<JButton
				jstyle='secondary'
				onClick={addNewItem}
				data-grid_nav_col='MIG_name'
				data-grid_nav_index={gridNavIndex}
			>
				Add new Item
			</JButton>
		</div>
	)
	gridNavIndex++
	gridNav.setEndIndex(gridNavIndex)

	const gridConfig: JGridTypes.Props = {
		headers,
		cells,
		noBorders: true,
		className: s.grid,
		stickyHeaders: true,
	}
	return (
		<div className={`${s.items_container} ${s.multi_item}`}>
			<JGrid {...gridConfig} />
		</div>
	)
}
