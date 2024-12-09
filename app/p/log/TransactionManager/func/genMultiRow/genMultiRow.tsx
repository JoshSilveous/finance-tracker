import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { FetchedAccount, FetchedCategory, FetchedTransaction } from '@/database'
import s from './genMultiRow.module.scss'
import { delay } from '@/utils'
import { createFoldToggleHandler } from './createFoldToggleHandler'
import { reorderMouseDownHandler } from './reorderMouseDownHandler'
import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { FoldState } from '../../TransactionManager'

export interface GenMultiRowProps {
	transaction: FetchedTransaction
	transactionIndex: number
	categories: FetchedCategory[]
	accounts: FetchedAccount[]
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	handleTransactionItemReorder: (oldIndex: number, newIndex: number) => void
	/**
	 * Provide a stateful value for the fold/unfold state of this transaction.
	 *
	 * **INITIAL RENDER VALUE MUST BE `FALSE`**
	 */
	folded: boolean
	playAnimation: boolean
	prevIsFoldedOrderRef: MutableRefObject<FoldState[] | null>
	setFoldStateArr: Dispatch<SetStateAction<FoldState[]>>
	/**
	 * MouseDown handler for when the WHOLE transaction is being resorted
	 */
	onWholeResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}
export function genMultiRow({
	transaction,
	transactionIndex,
	categories,
	accounts,
	dropdownOptionsCategory,
	dropdownOptionsAccount,
	handleTransactionItemReorder,
	folded,
	playAnimation,
	prevIsFoldedOrderRef,
	setFoldStateArr,
	onWholeResortMouseDown,
}: GenMultiRowProps) {
	const uniqueCategories: string[] = []
	const uniqueAccounts: string[] = []
	transaction.items.forEach((item) => {
		if (item.category_id !== null) {
			const categoryName = categories.find((cat) => cat.id === item.category_id)!.name
			if (uniqueCategories.findIndex((item) => item === categoryName) === -1) {
				uniqueCategories.push(categoryName)
			}
		}
		if (item.account_id !== null) {
			const accountName = accounts.find((act) => act.id === item.account_id)!.name
			if (uniqueAccounts.findIndex((item) => item === accountName) === -1) {
				uniqueAccounts.push(accountName)
			}
		}
	})

	// moved extensive fold logic to separate file
	const handleFoldToggle = createFoldToggleHandler(
		folded,
		transaction,
		transactionIndex,
		playAnimation,
		setFoldStateArr,
		prevIsFoldedOrderRef
	)

	let sum = 0
	const itemRows = transaction.items.map((item, itemIndex) => {
		sum += item.amount

		// moved extensive reorder logic to separate file
		function handleReorderMouseDown(e: React.MouseEvent<HTMLInputElement>) {
			reorderMouseDownHandler(
				e,
				item,
				itemIndex,
				transaction,
				handleTransactionItemReorder
			)
		}

		return [
			<div
				className={s.cell_container}
				data-parent_id={transaction.id}
				data-item_id={item.id}
				key={`${transaction.id}-${item.id}-1`}
			>
				<div
					className={s.reorder_grabber}
					onMouseDown={handleReorderMouseDown}
					title='Grab and drag to reposition this item'
				>
					<ReorderIcon />
				</div>
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={transaction.id}
				data-item_id={item.id}
				key={`${transaction.id}-${item.id}-2`}
			>
				<JDatePicker value={transaction.date} disabled minimalStyle />
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={transaction.id}
				data-item_id={item.id}
				key={`${transaction.id}-${item.id}-3`}
			>
				<JInput value={item.name} />
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={transaction.id}
				data-item_id={item.id}
				key={`${transaction.id}-${item.id}-4`}
			>
				<JNumberAccounting value={item.amount} data-rerender_tag={transaction.id} />
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={transaction.id}
				data-item_id={item.id}
				key={`${transaction.id}-${item.id}-5`}
			>
				<JDropdown
					options={dropdownOptionsCategory}
					value={item.category_id !== null ? item.category_id : 'none'}
				/>
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={transaction.id}
				data-item_id={item.id}
				key={`${transaction.id}-${item.id}-7`}
			>
				<JDropdown
					options={dropdownOptionsAccount}
					value={item.account_id !== null ? item.account_id : 'none'}
				/>
			</div>,
		]
	})

	const uniqueColumnClassNames = [
		'control',
		'date',
		'name',
		'amount',
		'category',
		'account',
	]
	const firstRow = [
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${transaction.id}-1`}
			data-transaction_id={transaction.id}
		>
			<div
				className={s.reorder_grabber}
				onMouseDown={onWholeResortMouseDown}
				title='Grab and drag to reposition this item'
			>
				<ReorderIcon />
			</div>
			<div
				className={`${s.fold_toggle} ${folded ? s.folded : ''}`}
				data-transaction_id={transaction.id}
				onClick={handleFoldToggle}
				title={folded ? 'Click to reveal items' : 'Click to hide items'}
			>
				<FoldArrow />
			</div>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${transaction.id}-2`}
			data-transaction_id={transaction.id}
		>
			<JDatePicker value={transaction.date} />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${transaction.id}-3`}
			data-transaction_id={transaction.id}
		>
			<JInput value={transaction.name} />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${transaction.id}-4`}
			data-transaction_id={transaction.id}
		>
			<JNumberAccounting value={sum} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${transaction.id}-5`}
			data-transaction_id={transaction.id}
		>
			<JInput value={uniqueCategories.join(', ')} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${transaction.id}-6`}
			data-transaction_id={transaction.id}
		>
			<JInput value={uniqueAccounts.join(', ')} disabled minimalStyle />
		</div>,
	]

	const columns = firstRow.map((rowItem, rowItemIndex) => {
		return (
			<div
				className={`${s.column} ${s[uniqueColumnClassNames[rowItemIndex]]}`}
				data-transaction_id={transaction.id}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return columns
}
