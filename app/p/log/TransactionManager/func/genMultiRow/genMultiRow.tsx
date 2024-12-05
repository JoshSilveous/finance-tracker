import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { default as FoldArrow } from '@/public/dropdown_arrow.svg'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { FetchedAccount, FetchedCategory, FetchedTransaction } from '@/database'
import s from './genMultiRow.module.scss'
import { delay } from '@/utils'

export interface GenMultiRowProps {
	transaction: FetchedTransaction
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
	/**
	 * Function that runs when the transaction's items are folded (hidden)
	 */
	onFold: () => void
	/**
	 * Function that runs when the transaction's items are unfolded (revealed)
	 */
	onUnfold: () => void
}
export function genMultiRow({
	transaction,
	categories,
	accounts,
	dropdownOptionsCategory,
	dropdownOptionsAccount,
	handleTransactionItemReorder,
	folded,
	onFold,
	onUnfold,
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

	let isFolded = folded
	function getColumnNodes() {
		return Array.from(
			document.querySelectorAll(
				`.${s.column}[data-transaction_id="${transaction.id}"]`
			)
		) as HTMLDivElement[]
	}

	const foldAnimationTime = 500
	let isFolding = false
	let cancelAnim: (() => void) | null = null

	function handleFoldToggle() {
		const toggleArrowNode = document.querySelector(
			`.${s.fold_toggle}[data-transaction_id="${transaction.id}"]`
		) as HTMLDivElement
		toggleArrowNode.style.transition = `scale 0.1s ease, color 0.1s ease, transform ${
			foldAnimationTime / 1000
		}s ease`

		if (isFolded) {
			toggleArrowNode.classList.remove(s.folded)
			if (isFolding === false) {
				unfold()
			} else {
				cancelAnim!()
				unfold()
			}
			isFolded = false
		} else {
			toggleArrowNode.classList.add(s.folded)
			if (isFolding === false) {
				fold()
			} else {
				cancelAnim!()
				fold()
			}
			isFolded = true
		}
	}

	function fold() {
		isFolding = true
		let cancelled = false
		cancelAnim = () => {
			cancelled = true
		}

		const cols = getColumnNodes()
		const firstRowHeight = document.querySelector(
			`.${s.first_row}[data-transaction_id="${transaction.id}"]`
		)!.clientHeight
		cols.forEach(async (col) => {
			const colStyle = getComputedStyle(col)
			const startingHeight = colStyle.height
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			col.style.height = startingHeight
			await delay(10)
			if (cancelled) {
				return
			}
			col.style.height = firstRowHeight + 'px'
			await delay(foldAnimationTime)
			if (cancelled) {
				return
			}
			col.style.height = ''
			col.classList.add(s.folded)
			isFolding = false
			cancelAnim = null
			onFold()
		})
	}

	function unfold() {
		isFolding = true
		let cancelled = false
		cancelAnim = () => {
			cancelled = true
		}

		const cells = Array.from(
			document.querySelectorAll(
				`.${s.column}.${s.date}[data-transaction_id="${transaction.id}"] > .${s.cell_container}`
			)
		) as HTMLDivElement[]
		const cols = getColumnNodes()
		const firstRowHeight = document.querySelector(
			`.${s.first_row}[data-transaction_id="${transaction.id}"]`
		)!.clientHeight

		cols.forEach((col) => {
			col.classList.remove(s.folded)
		})

		// calculate full height to return to
		// (cannot just set to 100%, animation won't play)
		let fullColHeight = 0
		cells.forEach((cell) => {
			fullColHeight += cell.clientHeight
		})
		const gapSize = parseInt(getComputedStyle(cols[0]).gap)
		fullColHeight += (cells.length - 1) * gapSize

		// apply new height animation
		cols.forEach(async (col) => {
			const startingHeight = firstRowHeight + 'px'
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			col.style.height = startingHeight
			await delay(10)
			if (cancelled) {
				return
			}
			col.style.height = fullColHeight + 'px'
			await delay(foldAnimationTime)
			if (cancelled) {
				return
			}
			col.style.height = ''
			isFolding = false
			cancelAnim = null
			onUnfold()
		})
	}

	let sum = 0
	const itemRows = transaction.items.map((item, itemIndex) => {
		sum += item.amount

		const isLastRow = itemIndex === transaction.items.length - 1

		function handleReorderMouseDown(e: React.MouseEvent<HTMLInputElement>) {
			/* sometimes, a <path> element is the target instead of the SVG, meaning that
			grabberNode is the <svg> instead of the parent <div>.
			this prevents that from creating a bug: */
			const grabberNode =
				(e.target as HTMLElement).tagName === 'svg'
					? ((e.target as SVGElement).parentElement as HTMLDivElement)
					: ((e.target as SVGElement).parentElement!
							.parentElement as HTMLDivElement)

			const grabberContainerNode = grabberNode.parentElement as HTMLDivElement
			const thisRow = Array.from(
				document.querySelectorAll(`[data-item_id="${item.id}"]`)
			) as HTMLDivElement[]

			const thisRowIndex = itemIndex

			const offsetX =
				grabberNode.offsetLeft +
				grabberNode.offsetWidth / 2 -
				grabberContainerNode.offsetLeft -
				4
			const offsetY =
				grabberNode.offsetTop +
				grabberNode.offsetHeight / 2 -
				grabberContainerNode.offsetTop +
				4

			let leftOffset = 0
			thisRow.forEach((node, index) => {
				let widthOffset = 0
				// patches for minor visual issues. after a few hours, i decided it wasn't worth the time troubleshooting the css for this
				if (index === 1) {
					widthOffset += 7.5
				}
				if (index > 1) {
					widthOffset += 5
				}
				if (index === 5) {
					widthOffset += 2.5
				}

				node.style.width = `${node.offsetWidth + widthOffset}px`
				node.style.left = `${e.clientX - offsetX + leftOffset}px`
				node.style.top = `${e.clientY - offsetY}px`
				node.classList.add(s.popped_out)
				leftOffset += node.clientWidth
			})

			let allRows = transaction.items.map((item) => {
				return Array.from(
					document.querySelectorAll(`[data-item_id="${item.id}"]`)
				) as HTMLDivElement[]
			})

			const otherRows = allRows.filter((_, index) => index !== thisRowIndex)

			const breakpoints = otherRows.map((row) => row[0].offsetTop)
			breakpoints.push(
				breakpoints.at(-1)! + (allRows.at(-1)![0] as HTMLDivElement).offsetHeight
			)

			let firstRun = true
			const isLastRowSelected = thisRowIndex === allRows.length - 1
			function putMarginGapOnRow(rowIndex: number | 'none') {
				// if ending the animation, remove transition effects
				if (rowIndex === 'none') {
					allRows.forEach((rowNodes) => {
						rowNodes.forEach((node) => {
							node.classList.remove(s.transitions)
						})
					})
				}
				// remove all current margin modifications
				allRows.forEach((rowNodes) => {
					rowNodes.forEach((node) => {
						node.classList.remove(
							s.margin_top,
							s.margin_bottom,
							s.margin_top_double,
							s.margin_bottom_double,
							s.remove_border_radius,
							s.add_border_radius
						)
					})
				})
				if (rowIndex === 'none') {
					return
				}

				rowIndex--

				// border radius handling when last row is selected
				if (isLastRowSelected && rowIndex !== transaction.items.length - 2) {
					thisRow.forEach((node) => {
						node.classList.add(s.remove_border_radius)
					})
					otherRows.at(-1)!.forEach((node) => {
						node.classList.add(s.add_border_radius)
					})
				}

				// if hovering over first row
				if (rowIndex === -1) {
					otherRows[0].forEach((node) => {
						node.classList.add(s.margin_top_double)
					})
				}
				// if hovering over last row
				else if (rowIndex === transaction.items.length - 2) {
					otherRows.at(-1)!.forEach((node) => {
						node.classList.add(s.margin_bottom_double, s.remove_border_radius)
					})
					thisRow.forEach((node) => {
						node.classList.add(s.add_border_radius)
					})
				} else {
					otherRows[rowIndex].forEach((node) =>
						node.classList.add(s.margin_bottom)
					)
					otherRows[rowIndex + 1].forEach((node) =>
						node.classList.add(s.margin_top)
					)
				}

				if (firstRun) {
					const delay = setTimeout(() => {
						allRows.forEach((row) => {
							row.forEach((node) => {
								node.classList.add(s.transitions)
							})
						})
						clearTimeout(delay)
					}, 10)
				}
			}
			function getClosestBreakpointIndex(yPos: number) {
				return breakpoints.reduce((closestIndex, currentValue, currentIndex) => {
					return Math.abs(currentValue - yPos) <
						Math.abs(breakpoints[closestIndex] - yPos)
						? currentIndex
						: closestIndex
				}, 0)
			}
			let closestBreakpointIndex = getClosestBreakpointIndex(e.clientY)

			putMarginGapOnRow(thisRowIndex)
			function handleReorderMouseMove(e: MouseEvent) {
				let leftOffset = 0
				thisRow.forEach((node) => {
					node.style.left = `${e.clientX - offsetX + leftOffset}px`
					node.style.top = `${e.clientY - offsetY}px`
					leftOffset += node.clientWidth
				})

				const prevClosestBreakpointIndex = closestBreakpointIndex
				closestBreakpointIndex = getClosestBreakpointIndex(e.clientY)
				if (firstRun || prevClosestBreakpointIndex !== closestBreakpointIndex) {
					putMarginGapOnRow(closestBreakpointIndex)
				}
				firstRun = false
			}

			function handleReorderMouseUp() {
				putMarginGapOnRow('none')
				thisRow.forEach((node) => {
					node.style.width = ''
					node.style.top = ''
					node.style.left = ''
					node.classList.remove(s.popped_out)
				})

				document.body.style.cursor = ''
				window.removeEventListener('mousemove', handleReorderMouseMove)
				window.removeEventListener('mouseup', handleReorderMouseUp)
				window.removeEventListener('contextmenu', handleRightClick)
				document.body.style.cursor = ''

				if (thisRowIndex !== closestBreakpointIndex) {
					handleTransactionItemReorder(thisRowIndex, closestBreakpointIndex)
				}
			}
			function handleRightClick(e: MouseEvent) {
				e.preventDefault()
				window.removeEventListener('mousemove', handleReorderMouseMove)
				window.removeEventListener('mouseup', handleReorderMouseUp)
				window.removeEventListener('contextmenu', handleRightClick)
			}
			window.addEventListener('mousemove', handleReorderMouseMove)
			window.addEventListener('mouseup', handleReorderMouseUp)
			window.addEventListener('contextmenu', handleRightClick)
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
					title='Grab to reposition this item'
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
				className={`${s.fold_toggle} ${isFolded ? s.folded : ''}`}
				data-transaction_id={transaction.id}
				onClick={handleFoldToggle}
				title={isFolded ? 'Click to reveal items' : 'Click to hide items'}
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

	const cols = firstRow.map((rowItem, rowItemIndex) => {
		return (
			<div
				className={`${s.column} ${s[uniqueColumnClassNames[rowItemIndex]]}`}
				data-transaction_id={transaction.id}
			>
				{rowItem} {itemRows.map((itemRow) => itemRow[rowItemIndex])}
			</div>
		)
	})

	return cols
}
