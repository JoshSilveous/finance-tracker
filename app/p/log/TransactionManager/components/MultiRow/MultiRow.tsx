import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import {
	useMemo,
	useRef,
	forwardRef,
	useEffect,
	useCallback,
	ChangeEventHandler,
	FocusEventHandler,
} from 'react'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { FormTransaction } from '../../TransactionManager'
import s from './MultiRow.module.scss'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { genLiveVals, LiveVals } from './genLiveVals'
import { PendingChanges } from '../../hooks/usePendingChanges'
import { SortOrder, FoldStateUpdater, HistoryController } from '../../hooks'
import { foldRenderer } from './func/foldRenderer'

export interface MultiRowProps {
	transaction: FormTransaction
	transactionIndex: number
	pendingChanges: PendingChanges.Controller
	dropdownOptions: { category: JDropdownTypes.Option[]; account: JDropdownTypes.Option[] }
	folded: boolean
	playAnimation: boolean
	updateFoldState: FoldStateUpdater
	transactionSortPosChanged: boolean
	defSortOrder: SortOrder.State
	disableTransactionResort: boolean
	historyController: HistoryController
	sortOrder: SortOrder.Controller
}

export type ItemRowRefs = { item_id: string; cells: HTMLDivElement[] }[]

export const MultiRow = forwardRef<HTMLDivElement, MultiRowProps>((p, forwardedRef) => {
	if (p.transaction.name === 'El Vac') {
		console.log(`ren "${p.transaction.name}" folded:${p.folded} play:${p.playAnimation}`)
	}
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
				const categoryName = p.dropdownOptions.category.find(
					(cat) => cat.value === item.category_id
				)!.name
				if (arr.findIndex((item) => item === categoryName) === -1) {
					arr.push(categoryName)
				}
			}
		})
		return arr
	}, [p.dropdownOptions.category, p.transaction])
	const uniqueAccounts = useMemo(() => {
		const arr: string[] = []
		p.transaction.items.forEach((item) => {
			if (item.account_id !== null) {
				const accountName = p.dropdownOptions.account.find(
					(act) => act.value === item.account_id
				)!.name
				if (arr.findIndex((item) => item === accountName) === -1) {
					arr.push(accountName)
				}
			}
		})
		return arr
	}, [p.dropdownOptions.account, p.transaction])

	// paint fold state / animation after dom renders
	useEffect(() => {
		const columnNodes = columnNodesRef.current as HTMLDivElement[]
		const render = foldRenderer(columnNodes)

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

	// re-calculates the displayed value (from default transaction or pendingChange)
	const liveVals = useMemo(
		() => genLiveVals(p.transaction, p.pendingChanges.cur),
		[p.transaction, p.pendingChanges.cur]
	)

	const eventHandlers = useMemo(() => {
		return {
			onChange: ((e) => {
				const key = e.target.dataset.key as
					| keyof LiveVals
					| keyof LiveVals['items'][number]
				const item_id = e.target.dataset.item_id
				const newVal = e.target.value

				p.historyController.clearRedo()

				// update pendingChanges
				if (item_id === undefined) {
					if (key === 'date' || key === 'name') {
						const origVal = p.transaction[key]
						if (origVal !== newVal) {
							p.pendingChanges.update(
								'transactions',
								transaction_id,
								key,
								newVal
							)
						} else {
							p.pendingChanges.update('transactions', transaction_id, key)
						}
					} else {
					}
				} else {
					if (
						key === 'name' ||
						key === 'amount' ||
						key === 'category_id' ||
						key === 'account_id'
					) {
						const origVal = p.transaction.items.find(
							(item) => item.id === item_id
						)![key]
						if (origVal !== newVal) {
							p.pendingChanges.update('items', item_id, key, newVal)
						} else {
							p.pendingChanges.update('items', item_id, key)
						}
					} else {
					}
				}

				// update history
				const oldVal = e.target.dataset.value_on_focus
				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date') {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (key === 'name' && item_id === undefined) {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (
						(key === 'name' ||
							key === 'amount' ||
							key === 'category_id' ||
							key === 'account_id') &&
						item_id !== undefined
					) {
						p.historyController.upsert({
							type: 'item_value_change',
							transaction_id: p.transaction.id,
							item_id: item_id,
							key,
							oldVal,
							newVal,
						})
					}
				}
			}) as ChangeEventHandler<HTMLInputElement | HTMLSelectElement>,
			onBlur: ((e) => {
				const key = e.target.dataset.key as
					| keyof LiveVals
					| keyof LiveVals['items'][number]
				const item_id = e.target.dataset.item_id
				const newVal = e.target.value
				const oldVal = e.target.dataset.value_on_focus
				if (oldVal !== undefined && newVal !== oldVal) {
					if (key === 'date') {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (key === 'name' && item_id === undefined) {
						p.historyController.upsert({
							type: 'transaction_value_change',
							transaction_id: p.transaction.id,
							key,
							oldVal,
							newVal,
						})
					} else if (
						(key === 'name' ||
							key === 'amount' ||
							key === 'category_id' ||
							key === 'account_id') &&
						item_id !== undefined
					) {
						p.historyController.upsert({
							type: 'item_value_change',
							transaction_id: p.transaction.id,
							item_id: item_id,
							key,
							oldVal,
							newVal,
						})
					}
				}
			}) as FocusEventHandler<HTMLInputElement | HTMLSelectElement>,
			onFocus: ((e) => {
				e.target.dataset.value_on_focus = e.target.value
			}) as FocusEventHandler<HTMLInputElement | HTMLSelectElement>,
		}
	}, [])

	let sum = 0
	const itemRows = p.transaction.items.map((item, itemIndex) => {
		sum += Number(liveVals.items[item.id].amount.val)

		const itemSortPosChanged =
			(
				p.defSortOrder[p.transaction.date].find(
					(it) => it[0] === transaction_id
				) as string[]
			).findIndex((it) => it === item.id) !==
			itemIndex + 1

		return [
			<div
				className={s.cell_container}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-1`}
				ref={addToItemRowsRef(item.id)}
			>
				<div
					className={`${s.reorder_grabber} ${itemSortPosChanged ? s.changed : ''}`}
					title='Grab and drag to reposition this item'
				>
					<JButton
						jstyle='invisible'
						ref={p.sortOrder.addToItemReorderRefs(
							p.transaction,
							item,
							itemRowsRef
						)}
					>
						<ReorderIcon />
					</JButton>
				</div>
			</div>,
			<div
				className={s.cell_container}
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
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-3`}
				ref={addToItemRowsRef(item.id)}
			>
				<JInput
					value={liveVals.items[item.id].name.val}
					data-item_id={item.id}
					data-transaction_id={transaction_id}
					data-key='name'
					{...eventHandlers}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].amount.changed ? s.changed : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-4`}
				ref={addToItemRowsRef(item.id)}
			>
				<JNumberAccounting
					value={liveVals.items[item.id].amount.val}
					data-item_id={item.id}
					data-transaction_id={transaction_id}
					data-key='amount'
					{...eventHandlers}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].category_id.changed ? s.changed : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-5`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptions.category}
					value={
						liveVals.items[item.id].category_id.val !== null
							? liveVals.items[item.id].category_id.val!
							: 'none'
					}
					data-item_id={item.id}
					data-transaction_id={transaction_id}
					data-key='category_id'
					{...eventHandlers}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					liveVals.items[item.id].account_id.changed ? s.changed : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-7`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptions.account}
					value={
						liveVals.items[item.id].account_id.val !== null
							? liveVals.items[item.id].account_id.val!
							: 'none'
					}
					data-item_id={item.id}
					data-transaction_id={transaction_id}
					data-key='account_id'
					{...eventHandlers}
				/>
			</div>,
		]
	})

	const firstRow = [
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-1`}>
			<div
				className={`${s.reorder_grabber} ${
					p.transactionSortPosChanged ? s.changed : ''
				}`}
				title={
					p.disableTransactionResort
						? "Repositioning not allowed while there's only one transaction under this date"
						: 'Grab and drag to reposition this item'
				}
			>
				<JButton
					jstyle='invisible'
					disabled={p.disableTransactionResort}
					ref={p.sortOrder.addToTransactionReorderRefs(p.transaction)}
				>
					<ReorderIcon />
				</JButton>
			</div>
			<div
				className={`${s.fold_toggle} ${p.folded || p.playAnimation ? s.folded : ''}`}
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
		>
			<JDatePicker
				value={liveVals.date.val}
				data-transaction_id={transaction_id}
				data-key='date'
				{...eventHandlers}
			/>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${
				liveVals.name.changed ? s.changed : ''
			}`}
			key={`${p.transaction.id}-3`}
		>
			<JInput
				value={liveVals.name.val}
				data-transaction_id={transaction_id}
				data-key='name'
				{...eventHandlers}
			/>
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-4`}>
			<JNumberAccounting value={sum} disabled minimalStyle />
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-5`}>
			<JInput value={uniqueCategories.join(', ')} disabled minimalStyle />
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-6`}>
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
				ref={addToColumnNodesRef}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return (
		<div className={s.container} ref={forwardedRef}>
			{columns}
		</div>
	)
})
