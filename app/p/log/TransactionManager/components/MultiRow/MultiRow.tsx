import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { useMemo, useRef, forwardRef, useEffect, useCallback } from 'react'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { default as InsertRowIcon } from '@/public/insert_row.svg'
import { FormTransaction } from '../../TransactionManager'
import s from './MultiRow.module.scss'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { PendingChangeController } from '../../hooks/usePendingChanges'
import { FoldStateUpdater, TabIndexer } from '../../hooks'
import { foldRenderer } from './func/foldRenderer'
import { OptionsMenu } from '../OptionsMenu/OptionsMenu'
import { genEventHandlers } from './func/genEventHandlers'
import { genUniqueLists } from './func/genUniqueLists'
import { delay } from '@/utils'
import { Data, HistoryController, SortOrder } from '../../../Dashboard/hooks'

export interface MultiRowProps {
	transaction: Data.StateTransaction
	data: Data.Controller
	transactionIndex: number
	dropdownOptions: { category: JDropdownTypes.Option[]; account: JDropdownTypes.Option[] }
	folded: boolean
	playAnimation: boolean
	updateFoldState: FoldStateUpdater
	transactionSortPosChanged: boolean
	disableTransactionResort: boolean
	historyController: HistoryController
	sortOrder: SortOrder.Controller
	gridRow: number
	tabIndexer: TabIndexer
	gridNavIndex: number
}

export type ItemRowsRef = {
	item_id: string
	cells: HTMLDivElement[]
	undoDeleteDiv?: HTMLDivElement
}[]

export const MultiRow = forwardRef<HTMLDivElement, MultiRowProps>((p, forwardedRef) => {
	const columnNodesRef = useRef<(HTMLDivElement | null)[]>([])
	const addToColumnNodesRef = useCallback((node: HTMLDivElement) => {
		if (node && !columnNodesRef.current.includes(node)) {
			columnNodesRef.current.push(node)
		}
	}, [])

	const itemRowsRef = useRef<ItemRowsRef>([])
	const addToItemRowsRef = useCallback(
		(item_id: string, isUndoDeleteDiv?: boolean) => (node: HTMLDivElement) => {
			if (node !== null) {
				const itemRowRefIndex = itemRowsRef.current.findIndex(
					(ref) => ref.item_id === item_id
				)
				if (isUndoDeleteDiv) {
					itemRowsRef.current[itemRowRefIndex].undoDeleteDiv = node
				}
				if (itemRowRefIndex === -1) {
					itemRowsRef.current.push({
						item_id,
						cells: [node],
					})
				} else {
					itemRowsRef.current[itemRowRefIndex].cells.push(node)
				}
			}
		},
		[]
	)
	itemRowsRef.current = [] // wipe refs every re-render

	const uniqueLists = genUniqueLists(p)

	const undoDeleteRef = useRef<HTMLButtonElement>(null)
	const dateSelectRef = useRef<HTMLInputElement>(null)

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

	const eventHandlers = genEventHandlers(p)

	const sum = (() => {
		let sum = 0
		p.transaction.items.forEach((item) => {
			sum += Number(item.amount.val)
		})
		return sum
	})()

	const firstRow = [
		<div
			className={`${s.cell_container} ${s.first_row} ${
				p.transaction.pendingDeletion ? s.transaction_pending_deletion : ''
			}`}
			key={`${p.transaction.id}-1`}
		>
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
					tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
					data-grid_nav_col='TM_left_controls'
					data-grid_nav_index={p.gridNavIndex}
				>
					<ReorderIcon />
				</JButton>
			</div>
			<div
				className={`${s.fold_toggle} ${p.folded || p.playAnimation ? s.folded : ''}`}
				onClick={() => p.updateFoldState(p.transaction.id)}
				title={p.folded ? 'Click to reveal items' : 'Click to hide items'}
			>
				<JButton
					jstyle='invisible'
					tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
					data-grid_nav_col='TM_left_controls'
					data-grid_nav_index={p.gridNavIndex}
				>
					<FoldArrow />
				</JButton>
			</div>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${
				p.transaction.date.changed ? s.changed : ''
			}`}
			key={`${p.transaction.id}-2`}
		>
			<JDatePicker
				value={p.transaction.date.val}
				data-transaction_id={p.transaction.id}
				data-key='date'
				ref={dateSelectRef}
				tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
				{...eventHandlers}
				data-grid_nav_col='TM_date'
				data-grid_nav_index={p.gridNavIndex}
			/>
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${
				p.transaction.name.changed ? s.changed : ''
			}`}
			key={`${p.transaction.id}-3`}
		>
			<JInput
				value={p.transaction.name.val}
				data-transaction_id={p.transaction.id}
				data-key='name'
				tabIndex={p.transaction.pendingDeletion ? -1 : p.tabIndexer()}
				{...eventHandlers}
				data-grid_nav_col='TM_name'
				data-grid_nav_index={p.gridNavIndex}
			/>
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-4`}>
			<JNumberAccounting value={sum} disabled minimalStyle />
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-5`}>
			<JInput value={uniqueLists.categories} disabled minimalStyle />
		</div>,
		<div className={`${s.cell_container} ${s.first_row}`} key={`${p.transaction.id}-6`}>
			<JInput value={uniqueLists.accounts} disabled minimalStyle />
		</div>,
		<div
			className={`${s.cell_container} ${s.first_row} ${s.more_controls_container} ${
				p.transaction.pendingDeletion ? s.transaction_pending_deletion : ''
			}`}
		>
			<OptionsMenu
				width={150}
				height={110}
				test_transaction_id={p.transaction.name.val}
				className={s.more_controls}
				tabIndex={p.transaction.pendingDeletion ? undefined : p.tabIndexer()}
				data-grid_nav_col='TM_right_controls'
				data-grid_nav_index={p.gridNavIndex}
				options={[
					{
						text: 'Delete',
						icon: <DeleteIcon />,
						onClick: () => {
							p.data.stageDelete('transaction', p.transaction.id)
							if (undoDeleteRef.current !== null) {
								undoDeleteRef.current.focus()
							}
							if (!p.folded) {
								p.updateFoldState(p.transaction.id, true)
							}
						},
						className: s.delete,
					},
					{
						text: 'Add Item',
						icon: <InsertRowIcon />,
						onClick: () =>
							p.data.stageCreate('item', p.transaction.id, {
								rel: 'above',
								item_id: p.transaction.items[0].id,
							}),

						className: s.add_item,
					},
				]}
			/>
		</div>,
	]

	const itemRows = p.transaction.items.map((item, itemIndex) => {
		const itemSortPosChanged = (() => {
			if (item.pendingCreation) {
				return true
			}
			const defSort = p.sortOrder.def[p.transaction.date.val].find((it) =>
				Array.isArray(it) ? it[0] === p.transaction.id : it === p.transaction.id
			)!
			if (Array.isArray(defSort)) {
				return defSort.findIndex((it) => it === item.id) !== itemIndex + 1
			} else {
				return true
			}
		})()

		const handleDelete = () => {
			p.data.stageDelete('item', item.id, p.transaction.id)

			delay(10).then(() => {
				const thisItemRef = itemRowsRef.current!.find(
					(it) => it.item_id === item.id
				)!
				if (thisItemRef.undoDeleteDiv) {
					;(thisItemRef.undoDeleteDiv.children[0] as HTMLButtonElement).focus()
				}
			})
		}

		const handleAddItem = () =>
			p.data.stageCreate('item', p.transaction.id, { rel: 'below', item_id: item.id })

		return [
			<div
				className={`${s.cell_container} ${s.row_controls_container} ${
					p.transaction.pendingDeletion ? s.transaction_pending_deletion : ''
				} ${item.pendingDeletion ? s.item_pending_deletion : ''}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-1`}
				ref={addToItemRowsRef(item.id)}
			>
				{item.pendingCreation && (
					<div
						className={s.pending_creation_indicator}
						title="This item has been newly added, and hasn't been saved yet."
					>
						<div className={s.new_text}>NEW</div>
					</div>
				)}
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
						tabIndex={
							p.transaction.pendingDeletion || item.pendingDeletion
								? -1
								: p.tabIndexer()
						}
						data-grid_nav_col='TM_left_controls'
						data-grid_nav_index={p.gridNavIndex + itemIndex + 1}
					>
						<ReorderIcon />
					</JButton>

					{/* this text had to be injected somewhere into this array, this is the easiest way without messing up the layout */}
					{item.pendingDeletion && (
						<div className={s.pending_deletion_text}>
							This item will be deleted when you save changes.
						</div>
					)}
				</div>
			</div>,
			<div
				className={`${s.cell_container} ${
					p.transaction.pendingDeletion ? s.transaction_pending_deletion : ''
				} ${item.pendingDeletion ? s.item_pending_deletion : ''}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-2`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDatePicker value={p.transaction.date.val} disabled minimalStyle />
			</div>,
			<div
				className={`${s.cell_container} ${item.name.changed ? s.changed : ''} ${
					item.pendingDeletion ? s.item_pending_deletion : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-3`}
				ref={addToItemRowsRef(item.id)}
			>
				<JInput
					value={item.name.val}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='name'
					tabIndex={
						p.transaction.pendingDeletion || item.pendingDeletion
							? -1
							: p.tabIndexer()
					}
					{...eventHandlers}
					data-grid_nav_col='TM_name'
					data-grid_nav_index={p.gridNavIndex + itemIndex + 1}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${item.amount.changed ? s.changed : ''} ${
					item.pendingDeletion ? s.item_pending_deletion : ''
				}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-4`}
				ref={addToItemRowsRef(item.id)}
			>
				<JNumberAccounting
					value={item.amount.val}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='amount'
					tabIndex={
						p.transaction.pendingDeletion || item.pendingDeletion
							? -1
							: p.tabIndexer()
					}
					{...eventHandlers}
					data-grid_nav_col='TM_amount'
					data-grid_nav_index={p.gridNavIndex + itemIndex + 1}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					item.category_id.changed ? s.changed : ''
				} ${item.pendingDeletion ? s.item_pending_deletion : ''}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-5`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptions.category}
					value={item.category_id.val !== null ? item.category_id.val! : 'none'}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='category_id'
					tabIndex={
						p.transaction.pendingDeletion || item.pendingDeletion
							? -1
							: p.tabIndexer()
					}
					{...eventHandlers}
					data-grid_nav_col='TM_category'
					data-grid_nav_index={p.gridNavIndex + itemIndex + 1}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					item.pendingDeletion ? s.item_pending_deletion : ''
				} ${item.account_id.changed ? s.changed : ''}`}
				data-item_id={item.id}
				key={`${p.transaction.id}-${item.id}-7`}
				ref={addToItemRowsRef(item.id)}
			>
				<JDropdown
					options={p.dropdownOptions.account}
					value={item.account_id.val !== null ? item.account_id.val! : 'none'}
					data-item_id={item.id}
					data-transaction_id={p.transaction.id}
					data-key='account_id'
					tabIndex={
						p.transaction.pendingDeletion || item.pendingDeletion
							? -1
							: p.tabIndexer()
					}
					{...eventHandlers}
					data-grid_nav_col='TM_account'
					data-grid_nav_index={p.gridNavIndex + itemIndex + 1}
				/>
			</div>,
			<div
				className={`${s.cell_container} ${
					item.pendingDeletion ? s.item_pending_deletion : ''
				} ${s.more_controls_container} ${
					p.transaction.pendingDeletion ? s.transaction_pending_deletion : ''
				}`}
				key={`${p.transaction.id}-${item.id}-8`}
				ref={addToItemRowsRef(item.id)}
			>
				<OptionsMenu
					width={180}
					height={110}
					test_transaction_id={p.transaction.name.val}
					className={s.more_controls}
					tabIndex={item.pendingDeletion ? undefined : p.tabIndexer()}
					data-grid_nav_col='TM_right_controls'
					data-grid_nav_index={p.gridNavIndex + itemIndex + 1}
					options={[
						{
							text: 'Delete',
							icon: <DeleteIcon />,
							onClick: handleDelete,
							className: s.delete,
						},
						{
							text: 'Add Item',
							icon: <InsertRowIcon />,
							onClick: handleAddItem,
							className: s.add_item,
						},
					]}
				/>

				{/* this had to be injected somewhere into this array, this is the easiest way without messing up the layout */}
				{item.pendingDeletion && (
					<div
						className={s.pending_deletion_button}
						ref={addToItemRowsRef(item.id, true)}
					>
						<JButton
							jstyle='invisible'
							onClick={() => {
								p.data.unstageDelete('item', item.id, p.transaction.id)
							}}
							ref={undoDeleteRef}
							className={s.undo_delete_button}
							tabIndex={item.pendingDeletion ? p.tabIndexer() : -1}
						>
							Undo Delete
						</JButton>
					</div>
				)}
			</div>,
		]
	})

	const uniqueColumnClassNames = [
		s.control,
		s.date,
		s.name,
		s.amount,
		s.category,
		s.account,
		s.more_controls,
	]

	let columnCount = 0
	const genGridStyle = () => {
		columnCount++
		return {
			gridRow: `${p.gridRow} / ${p.gridRow + 1}`,
			gridColumn: `${columnCount} / ${columnCount + 1}`,
		} as React.CSSProperties
	}

	const columns = firstRow.map((rowItem, rowItemIndex) => {
		return (
			<div
				className={`${s.column} ${uniqueColumnClassNames[rowItemIndex]} ${
					p.folded && !p.playAnimation ? s.folded : ''
				} ${p.transaction.pendingCreation ? s.pending_creation : ''}`}
				style={genGridStyle()}
				ref={addToColumnNodesRef}
				key={rowItemIndex}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return (
		<div
			className={s.container}
			style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
			ref={forwardedRef}
		>
			{columns}

			<div
				className={`${s.delete_overlay} ${
					p.transaction.pendingDeletion ? s.visible : ''
				}`}
			>
				<div
					className={s.blur}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				/>
				<div
					className={s.color_overlay}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				/>
				<div
					className={s.text}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				>
					This transaction will be deleted when you save changes.
				</div>
				<div
					className={s.button_container}
					style={{ gridRow: `${p.gridRow} / ${p.gridRow + 1}` }}
				>
					<JButton
						jstyle='invisible'
						onClick={() => {
							p.data.unstageDelete('transaction', p.transaction.id)
							if (dateSelectRef.current !== null) {
								dateSelectRef.current.focus()
							}
						}}
						ref={undoDeleteRef}
						tabIndex={p.transaction.pendingDeletion ? p.tabIndexer() : -1}
					>
						Undo Delete
					</JButton>
				</div>
			</div>
		</div>
	)
})
