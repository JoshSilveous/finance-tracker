import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import {
	useMemo,
	useRef,
	forwardRef,
	useEffect,
	useCallback,
	ChangeEventHandler,
} from 'react'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import {
	FoldStateUpdater,
	PendingChanges,
	PendingChangeUpdater,
	StateTransaction,
} from '../TransactionManager'
import s from './MultiRow.module.scss'
import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { handleItemReorder } from './func/handleItemReorder'
import { foldRenderer } from './func/foldRenderer'
import { genLiveVals, LiveVals } from './genLiveVals'

export interface MultiRowProps {
	transaction: StateTransaction
	pendingChanges: PendingChanges
	updatePendingChanges: PendingChangeUpdater
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

export const MultiRow = forwardRef<HTMLDivElement, MultiRowProps>((p, forwardedRef) => {
	const transaction_id = p.transaction.id

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
		p.transaction.items.forEach((item) => {
			if (item.category_id !== null) {
				const categoryName = p.dropdownOptionsCategory.find(
					(cat) => cat.value === item.category_id
				)!.name
				if (arr.findIndex((item) => item === categoryName) === -1) {
					arr.push(categoryName)
				}
			}
		})
		return arr
	}, [p.dropdownOptionsCategory, p.transaction])
	const uniqueAccounts = useMemo(() => {
		const arr: string[] = []
		p.transaction.items.forEach((item) => {
			if (item.account_id !== null) {
				const accountName = p.dropdownOptionsAccount.find(
					(act) => act.value === item.account_id
				)!.name
				if (arr.findIndex((item) => item === accountName) === -1) {
					arr.push(accountName)
				}
			}
		})
		return arr
	}, [p.dropdownOptionsCategory, p.transaction])

	// paint fold state / animation after dom renders
	useEffect(() => {
		const columnNodes = columnNodesRef.current as HTMLDivElement[]
		const render = foldRenderer(columnNodes, p.transaction.id)

		if (p.folded && p.playAnimation) {
			render.foldAnimated()
		} else if (!p.folded && p.playAnimation) {
			render.unfoldAnimated()
		} else if (p.folded && !p.playAnimation) {
			render.fold()
		} else if (!p.folded && !p.playAnimation) {
			render.unfold()
		}

		// runs when this component unmounts to prevent animation bugs (e.x. when a multi-row is reordered)
		return render.cancel
	}, [p.folded, p.playAnimation])

	/**
	 * Re-calculates the displayed value (from default transaction or pendingChange)
	 */
	const liveVals = useMemo(
		() => genLiveVals(p.transaction, p.pendingChanges),
		[p.transaction, p.pendingChanges]
	)

	const handleChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement> =
		useCallback((e) => {
			const key = e.target.dataset.key as
				| keyof LiveVals
				| keyof LiveVals['items'][number]
			const item_id = e.target.dataset.item_id
			const newVal = e.target.value

			if (item_id === undefined) {
				if (key === 'date' || key === 'name') {
					const origVal = p.transaction[key]
					if (origVal !== newVal) {
						p.updatePendingChanges('transactions', transaction_id, key, newVal)
					} else {
						p.updatePendingChanges('transactions', transaction_id, key)
					}
				}
			} else {
				if (
					key === 'name' ||
					key === 'amount' ||
					key === 'category_id' ||
					key === 'account_id'
				) {
					const origVal = p.transaction.items.find((item) => item.id === item_id)![
						key
					]
					if (origVal !== newVal) {
						p.updatePendingChanges('items', item_id, key, newVal)
					} else {
						p.updatePendingChanges('items', item_id, key)
					}
				}
			}
		}, [])

	let sum = 0
	const itemRows = p.transaction.items.map((item, itemIndex) => {
		sum += Number(item.amount)

		return [
			<div
				className={s.cell_container}
				data-parent_id={p.transaction.id}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-1`}
				ref={addToItemRowsRef(item.id)}
			>
				<div
					className={s.reorder_grabber}
					onMouseDown={handleItemReorder(
						item,
						itemRowsRef.current,
						itemIndex,
						p.transaction,
						p.onItemReorder
					)}
					title='Grab and drag to reposition this item'
				>
					<ReorderIcon />
				</div>
			</div>,
			<div
				className={s.cell_container}
				data-parent_id={p.transaction.id}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-2`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDatePicker value={liveVals.date.val} disabled minimalStyle />
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].name.changed ? s.changed : ''
				}`}
				data-parent_id={p.transaction.id}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-3`}
				ref={addToItemRowsRef(item.id)}
			>
				<JInput
					value={liveVals.items[item.id].name.val}
					onChange={handleChange}
					onBlur={handleChange}
					data-item_id={item.id}
					data-key='name'
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].amount.changed ? s.changed : ''
				}`}
				data-parent_id={p.transaction.id}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-4`}
				ref={addToItemRowsRef(item.id)}
			>
				<JNumberAccounting
					value={liveVals.items[item.id].amount.val}
					data-rerender_tag={p.transaction.id}
					onChange={handleChange}
					onBlur={handleChange}
					data-item_id={item.id}
					data-key='amount'
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].category_id.changed ? s.changed : ''
				}`}
				data-parent_id={p.transaction.id}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-5`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptionsCategory}
					value={
						liveVals.items[item.id].category_id.val !== null
							? liveVals.items[item.id].category_id.val!
							: 'none'
					}
					onChange={handleChange}
					onBlur={handleChange}
					data-item_id={item.id}
					data-key='category_id'
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].account_id.changed ? s.changed : ''
				}`}
				data-parent_id={p.transaction.id}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-7`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptionsAccount}
					value={
						liveVals.items[item.id].account_id.val !== null
							? liveVals.items[item.id].account_id.val!
							: 'none'
					}
					onChange={handleChange}
					onBlur={handleChange}
					data-item_id={item.id}
					data-key='account_id'
				/>
			</div>,
		]
	})

	const firstRow = [
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${p.transaction.id}-1`}
			data-transaction_id={p.transaction.id}
		>
			<div
				className={s.reorder_grabber}
				onMouseDown={p.onTransactionReorderMouseDown}
				title='Grab and drag to reposition this item'
			>
				<ReorderIcon />
			</div>
			<div
				className={`${s.fold_toggle} ${p.folded ? s.folded : ''}`}
				data-transaction_id={p.transaction.id}
				onClick={() => p.updateFoldState(p.transaction.id)}
				title={p.folded ? 'Click to reveal items' : 'Click to hide items'}
			>
				<FoldArrow />
			</div>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${
				liveVals.date.changed ? s.changed : ''
			}`}
			key={`${p.transaction.id}-2`}
			data-transaction_id={p.transaction.id}
		>
			<JDatePicker
				value={liveVals.date.val}
				onChange={handleChange}
				onBlur={handleChange}
				data-key='date'
			/>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${
				liveVals.name.changed ? s.changed : ''
			}`}
			key={`${p.transaction.id}-3`}
			data-transaction_id={p.transaction.id}
		>
			<JInput
				value={liveVals.name.val}
				onChange={handleChange}
				onBlur={handleChange}
				data-key='name'
			/>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${p.transaction.id}-4`}
			data-transaction_id={p.transaction.id}
		>
			<JNumberAccounting value={sum} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${p.transaction.id}-5`}
			data-transaction_id={p.transaction.id}
		>
			<JInput value={uniqueCategories.join(', ')} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row}`}
			key={`${p.transaction.id}-6`}
			data-transaction_id={p.transaction.id}
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
					p.folded && !p.playAnimation ? s.folded : ''
				}`}
				data-transaction_id={p.transaction.id}
				ref={addToColumnNodesRef}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return (
		<div
			className={s.container}
			data-transaction_id={p.transaction.id}
			ref={forwardedRef}
		>
			{columns}
		</div>
	)
})
