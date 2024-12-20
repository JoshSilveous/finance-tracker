import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDropdown } from '@/components/JForm/JDropdown/JDropdown'
import { DropdownOptions } from '../../../TransactionManager'
import { TransactionFormData } from './NewTransactionForm'
import s from './NewTransactionForm.module.scss'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'

interface MultiItemGridProps {
	items: TransactionFormData['items']
	handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>
	dropdownOptions: DropdownOptions
}
export function MultiItemGrid({ items, handleChange, dropdownOptions }: MultiItemGridProps) {
	const headers: JGridTypes.Header[] = [
		{ content: <></>, defaultWidth: 50, noResize: true },
		{ content: <div>Name</div>, defaultWidth: 100, minWidth: 80, maxWidth: 150 },
		{ content: <div>Amount</div>, defaultWidth: 100, minWidth: 80, maxWidth: 150 },
		{ content: <div>Category</div>, defaultWidth: 100, minWidth: 80, maxWidth: 150 },
		{ content: <div>Account</div>, defaultWidth: 100, minWidth: 80, maxWidth: 150 },
	]
	const cells: JGridTypes.Row[] = items.map((item) => <div>{item.amount}</div>)

	const gridConfig: JGridTypes.Props = {
		headers,
		cells,
		maxTableWidth: 600,
		noBorders: true,
	}
	return (
		<div className={`${s.items_container} ${s.multi_item}`}>
			<JGrid {...gridConfig} />
		</div>
	)
}
