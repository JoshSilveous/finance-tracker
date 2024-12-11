import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import {
	MutableRefObject,
	Dispatch,
	SetStateAction,
	useMemo,
	useCallback,
	useRef,
} from 'react'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { FoldState } from '../TransactionManager'
import s from './MultiRow.module.scss'
import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { handleItemReorder } from './func/handleItemReorder'
import { toggleFold } from './func/toggleFold'

interface MultiRowProps {
	/**
	 * The transaction used to generate this row. MUST be a multi-row (`transaction.items.length > 1`)
	 */
	transaction: FetchedTransaction
	/**
	 * Places a margin above the row
	 */
	placeMarginAbove: boolean
	/**
	 * Array of all categories in `JDropdownTypes.Option[]` format. Used to generate drop-down menus and extra data.
	 */
	dropdownOptionsCategory: JDropdownTypes.Option[]
	/**
	 * Array of all accounts in `JDropdownTypes.Option[]` format. Used to generate drop-down menus and extra data.
	 */
	dropdownOptionsAccount: JDropdownTypes.Option[]
	/**
	 * Fires when an item is repositioned within this multi-item transaction
	 * @param oldIndex The item's previous index
	 * @param newIndex The item's new index
	 */
	onItemReorder: (oldIndex: number, newIndex: number) => void
	/**
	 * Controls whether or not the multi-item appears folded
	 */
	folded: boolean
	/**
	 * If true, a fold/unfold animation will be played to accompany the `folded` value provided
	 */
	playAnimation: boolean
	/**
	 * Used to compare ref when running animation to determine if animation should be cancelled
	 */
	prevIsFoldedOrderRef: MutableRefObject<FoldState[] | null>
	/**
	 * Used to update state when folded/unfolded via toggle button
	 */
	setFoldStateArr: Dispatch<SetStateAction<FoldState[]>>
	/**
	 * MouseDown handler for when the WHOLE transaction is being resorted
	 */
	onTransactionReorderMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}
export function MultiRow({
	transaction,
	placeMarginAbove,
	dropdownOptionsCategory,
	dropdownOptionsAccount,
	onItemReorder,
	folded,
	playAnimation,
	prevIsFoldedOrderRef,
	setFoldStateArr,
	onTransactionReorderMouseDown,
}: MultiRowProps) {
	const columnNodesRef = useRef<(HTMLDivElement | null)[]>([])
	const addToColumnNodesRef = useCallback((node: HTMLDivElement) => {
		if (node && !columnNodesRef.current.includes(node)) {
			columnNodesRef.current.push(node)
		}
	}, [])

	const uniqueCategories = useMemo(() => {
		const arr: string[] = []
		transaction.items.forEach((item) => {
			if (item.category_id !== null) {
				const categoryName = dropdownOptionsCategory.find(
					(cat) => cat.value === item.category_id
				)!.name
				if (arr.findIndex((item) => item === categoryName) === -1) {
					arr.push(categoryName)
				}
			}
		})
		return arr
	}, [dropdownOptionsCategory, transaction])
	const uniqueAccounts = useMemo(() => {
		const arr: string[] = []
		transaction.items.forEach((item) => {
			if (item.account_id !== null) {
				const accountName = dropdownOptionsAccount.find(
					(act) => act.value === item.account_id
				)!.name
				if (arr.findIndex((item) => item === accountName) === -1) {
					arr.push(accountName)
				}
			}
		})
		return arr
	}, [dropdownOptionsCategory, transaction])

	// moved extensive fold logic to separate file
	const handleFoldClick = toggleFold(
		folded,
		transaction,
		playAnimation,
		setFoldStateArr,
		prevIsFoldedOrderRef,
		columnNodesRef
	)

	let sum = 0
	const itemRows = transaction.items.map((item, itemIndex) => {
		sum += item.amount

		// moved extensive reorder logic to separate file
		function handleReorderMouseDown(e: React.MouseEvent<HTMLInputElement>) {
			handleItemReorder(e, item, itemIndex, transaction, onItemReorder)
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

	const firstRow = [
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${transaction.id}-1`}
			data-transaction_id={transaction.id}
		>
			<div
				className={s.reorder_grabber}
				onMouseDown={onTransactionReorderMouseDown}
				title='Grab and drag to reposition this item'
			>
				<ReorderIcon />
			</div>
			<div
				className={`${s.fold_toggle} ${folded ? s.folded : ''}`}
				data-transaction_id={transaction.id}
				onClick={handleFoldClick}
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
	const uniqueColumnClassNames = [
		'control',
		'date',
		'name',
		'amount',
		'category',
		'account',
	]
	const columns = firstRow.map((rowItem, rowItemIndex) => {
		return (
			<div
				className={`${s.column} ${s[uniqueColumnClassNames[rowItemIndex]]} ${
					placeMarginAbove ? s.margin_above : ''
				} ${folded && !playAnimation ? s.folded : ''}`}
				data-transaction_id={transaction.id}
				ref={addToColumnNodesRef}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return <div className={s.container}>{columns}</div>
}
