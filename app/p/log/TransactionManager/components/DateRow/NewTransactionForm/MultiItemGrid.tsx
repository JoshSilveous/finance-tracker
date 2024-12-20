import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import { DropdownOptions } from '../../../TransactionManager'
import { TransactionFormData } from './NewTransactionForm'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './NewTransactionForm.module.scss'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { Dispatch, SetStateAction, useRef } from 'react'
import { handleReorder } from './handleReorder'

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
	const addToItemRowsRef = (node: HTMLDivElement) => {
		if (node !== null) {
			itemRowsRef.current.push(node)
		}
	}

	itemRowsRef.current = [] // wipe refs every re-render
	const headers: JGridTypes.Header[] = [
		{ content: <></>, defaultWidth: 50, noResize: true },
		{
			content: (
				<div className={s.header_container}>
					<div className={s.text}>Name</div>
				</div>
			),
			defaultWidth: 120,
			minWidth: 80,
			maxWidth: 150,
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
				<div className={s.header_container}>
					<div className={s.text}>Account</div>
				</div>
			),
			defaultWidth: 100,
			minWidth: 80,
			maxWidth: 150,
		},
	]
	const cells: JGridTypes.Row[] = formData.items.map((item, index) => (
		<div className={s.item_row} ref={addToItemRowsRef}>
			<div className={s.control_container}>
				<div
					className={s.reorder_grabber}
					title='Grab and drag to reposition this item'
				>
					<button
						type='button'
						onMouseDown={handleReorder(
							formData,
							setFormData,
							itemRowsRef.current,
							index
						)}
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
					>
						<DeleteIcon />
					</button>
				</div>
			</div>
			<div className={s.cell}>
				<JInput
					id={`item-name-${index}`}
					value={item.name}
					onChange={handleChange}
				/>
			</div>
			<div className={s.cell}>
				<JNumberAccounting
					id={`item-amount-${index}`}
					value={item.amount}
					onChange={handleChange}
				/>
			</div>
			<div className={s.cell}>
				<JDropdown
					id={`item-category_id-${index}`}
					options={dropdownOptions.category}
					value={item.category_id}
					onChange={handleChange}
				/>
			</div>
			<div className={s.cell}>
				<JDropdown
					id={`item-account_id-${index}`}
					options={dropdownOptions.account}
					value={item.account_id}
					onChange={handleChange}
				/>
			</div>
		</div>
	))

	const addNewItem = () => {
		setFormData((prev) => {
			const clone = structuredClone(prev)
			clone.items.push({ name: '', amount: '', category_id: '', account_id: '' })
			return clone
		})
	}

	cells.push()

	const gridConfig: JGridTypes.Props = {
		headers,
		cells,
		maxTableWidth: 600,
		noBorders: true,
		className: s.grid,
	}
	return (
		<div className={`${s.items_container} ${s.multi_item}`}>
			<JGrid {...gridConfig} />
			<div className={s.add_new_row}>
				<JButton jstyle='invisible' onClick={addNewItem}>
					Add new Item
				</JButton>
			</div>
		</div>
	)
}
