import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import { useMemo, useRef, forwardRef, useEffect, useCallback } from 'react'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { FoldStateUpdater, StateTransaction } from '../TransactionManager'
import s from './MultiRow.module.scss'
import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { handleItemReorder } from './func/handleItemReorder'
import { foldRenderer } from './func/foldRenderer'

export interface MultiRowProps {
	transaction: StateTransaction
	placeMarginAbove: boolean
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	onItemReorder: (oldIndex: number, newIndex: number) => void
	folded: boolean
	playAnimation: boolean
	/**
	 * See {@link FoldStateUpdater}
	 */
	updateFoldState: FoldStateUpdater
	onTransactionReorderMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}

export type ItemRowRefs = { item_id: string; cells: HTMLDivElement[] }[]

export const MultiRow = forwardRef<HTMLDivElement, MultiRowProps>((props, forwardedRef) => {
	const columnNodesRef = useRef<(HTMLDivElement | null)[]>([])
	const addToColumnNodesRef = useCallback((node: HTMLDivElement) => {
		if (node && !columnNodesRef.current.includes(node)) {
			columnNodesRef.current.push(node)
		}
	}, [])

	const itemRowsRef = useRef<ItemRowRefs>([])
	const addToItemRowsRef = useCallback(
		(item_id: string) => (node: HTMLDivElement) => {
			if (node !== null) {
				const itemRowRefIndex = itemRowsRef.current.findIndex(
					(ref) => ref.item_id === item_id
				)
				if (itemRowRefIndex === -1) {
					itemRowsRef.current.push({ item_id, cells: [node] })
				} else {
					itemRowsRef.current[itemRowRefIndex].cells.push(node)
				}
			}
		},
		[]
	)
	itemRowsRef.current = [] // wipe refs every re-render

	const uniqueCategories = useMemo(() => {
		const arr: string[] = []
		props.transaction.items.forEach((item) => {
			if (item.category_id !== null) {
				const categoryName = props.dropdownOptionsCategory.find(
					(cat) => cat.value === item.category_id
				)!.name
				if (arr.findIndex((item) => item === categoryName) === -1) {
					arr.push(categoryName)
				}
			}
		})
		return arr
	}, [props.dropdownOptionsCategory, props.transaction])
	const uniqueAccounts = useMemo(() => {
		const arr: string[] = []
		props.transaction.items.forEach((item) => {
			if (item.account_id !== null) {
				const accountName = props.dropdownOptionsAccount.find(
					(act) => act.value === item.account_id
				)!.name
				if (arr.findIndex((item) => item === accountName) === -1) {
					arr.push(accountName)
				}
			}
		})
		return arr
	}, [props.dropdownOptionsCategory, props.transaction])

	// paint fold state / animation after dom renders
	useEffect(() => {
		const columnNodes = columnNodesRef.current as HTMLDivElement[]
		const render = foldRenderer(columnNodes, props.transaction.id)

		if (props.folded && props.playAnimation) {
			render.foldAnimated()
		} else if (!props.folded && props.playAnimation) {
			render.unfoldAnimated()
		} else if (props.folded && !props.playAnimation) {
			render.fold()
		} else if (!props.folded && !props.playAnimation) {
			render.unfold()
		}

		// runs when this component unmounts to prevent animation bugs (e.x. when a multi-row is reordered)
		return render.cancel
	}, [props.folded, props.playAnimation])

	let sum = 0
	const itemRows = props.transaction.items.map((item, itemIndex) => {
		sum += Number(item.amount)

		return [
			<div
				className={s.cell_container}
				data-parent_id={props.transaction.id}
				data-item_id={item.id}
				key={`${props.transaction.id}-${item.id}-1`}
				ref={addToItemRowsRef(item.id)}
			>
				<div
					className={s.reorder_grabber}
					onMouseDown={handleItemReorder(
						item,
						itemRowsRef.current,
						itemIndex,
						props.transaction,
						props.onItemReorder
					)}
					title='Grab and drag to reposition this item'
				>
					<ReorderIcon />
				</div>
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={props.transaction.id}
				data-item_id={item.id}
				key={`${props.transaction.id}-${item.id}-2`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDatePicker value={props.transaction.date} disabled minimalStyle />
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={props.transaction.id}
				data-item_id={item.id}
				key={`${props.transaction.id}-${item.id}-3`}
				ref={addToItemRowsRef(item.id)}
			>
				<JInput value={item.name} />
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={props.transaction.id}
				data-item_id={item.id}
				key={`${props.transaction.id}-${item.id}-4`}
				ref={addToItemRowsRef(item.id)}
			>
				<JNumberAccounting
					value={item.amount}
					data-rerender_tag={props.transaction.id}
				/>
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={props.transaction.id}
				data-item_id={item.id}
				key={`${props.transaction.id}-${item.id}-5`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={props.dropdownOptionsCategory}
					value={item.category_id !== null ? item.category_id : 'none'}
				/>
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={props.transaction.id}
				data-item_id={item.id}
				key={`${props.transaction.id}-${item.id}-7`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={props.dropdownOptionsAccount}
					value={item.account_id !== null ? item.account_id : 'none'}
				/>
			</div>,
		]
	})

	const firstRow = [
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${props.transaction.id}-1`}
			data-transaction_id={props.transaction.id}
		>
			<div
				className={s.reorder_grabber}
				onMouseDown={props.onTransactionReorderMouseDown}
				title='Grab and drag to reposition this item'
			>
				<ReorderIcon />
			</div>
			<div
				className={`${s.fold_toggle} ${props.folded ? s.folded : ''}`}
				data-transaction_id={props.transaction.id}
				onClick={() => props.updateFoldState(props.transaction.id)}
				title={props.folded ? 'Click to reveal items' : 'Click to hide items'}
			>
				<FoldArrow />
			</div>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${props.transaction.id}-2`}
			data-transaction_id={props.transaction.id}
		>
			<JDatePicker value={props.transaction.date} />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${props.transaction.id}-3`}
			data-transaction_id={props.transaction.id}
		>
			<JInput value={props.transaction.name} />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${props.transaction.id}-4`}
			data-transaction_id={props.transaction.id}
		>
			<JNumberAccounting value={sum} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${props.transaction.id}-5`}
			data-transaction_id={props.transaction.id}
		>
			<JInput value={uniqueCategories.join(', ')} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${props.transaction.id}-6`}
			data-transaction_id={props.transaction.id}
		>
			<JInput value={uniqueAccounts.join(', ')} disabled minimalStyle />
		</div>,
	]

	const uniqueColumnClassNames = [
		s.control,
		s.date,
		s.name,
		s.amount,
		s.category,
		s.account,
	]
	const columns = firstRow.map((rowItem, rowItemIndex) => {
		return (
			<div
				className={`${s.column} ${uniqueColumnClassNames[rowItemIndex]} ${
					props.placeMarginAbove ? s.margin_above : ''
				} ${props.folded && !props.playAnimation ? s.folded : ''}`}
				data-transaction_id={props.transaction.id}
				ref={addToColumnNodesRef}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return (
		<div
			className={s.container}
			data-transaction_id={props.transaction.id}
			ref={forwardedRef}
		>
			{columns}
		</div>
	)
})
