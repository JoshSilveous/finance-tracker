import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedAccount, FetchedCategory, FetchedTransaction } from '@/database'
import s from './row_gen.module.scss'

export function genSingleRow(
	transaction: FetchedTransaction,
	dropdownOptionsCategory: JDropdownTypes.Option[],
	dropdownOptionsAccount: JDropdownTypes.Option[]
) {
	const transactionItem = transaction.items[0]
	return [
		<div className={s.row_controller}></div>,
		<div className={`${s.data_container} ${s.single_item} ${s.first_col}`}>
			<JDatePicker value={transaction.date} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JInput value={transaction.name} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JNumberAccounting value={transactionItem.amount} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JDropdown
				options={dropdownOptionsCategory}
				value={
					transactionItem.category_id !== null
						? transactionItem.category_id
						: undefined
				}
			/>
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.last_col}`}>
			<JDropdown
				options={dropdownOptionsAccount}
				value={
					transactionItem.account_id !== null
						? transactionItem.account_id
						: undefined
				}
			/>
		</div>,
	]
}

export function genMultiRow(
	transaction: FetchedTransaction,
	categories: FetchedCategory[],
	accounts: FetchedAccount[],
	dropdownOptionsCategory: JDropdownTypes.Option[],
	dropdownOptionsAccount: JDropdownTypes.Option[],
	handleTransactionItemReorder: (oldIndex: number, newIndex: number) => void
) {
	let sum = 0
	const nextRows = transaction.items.map((item, itemIndex) => {
		sum += item.amount

		const isLastRow = itemIndex === transaction.items.length - 1

		function handleReorderMouseDown(e: React.MouseEvent<HTMLInputElement>) {
			const grabberNode = e.target as HTMLDivElement
			const grabberContainerNode = grabberNode.parentElement as HTMLDivElement
			const rowNode = grabberContainerNode.parentElement!
				.parentElement as HTMLDivElement

			const thisRowIndex = itemIndex

			rowNode.childNodes.forEach((childNode) => {
				const node = childNode as HTMLDivElement
				node.style.width = `${node.offsetWidth}px`
			})
			const offsetX =
				grabberNode.offsetLeft +
				grabberNode.offsetWidth / 2 -
				grabberContainerNode.offsetLeft
			const offsetY =
				grabberNode.offsetTop +
				grabberNode.offsetHeight / 2 -
				grabberContainerNode.offsetTop

			rowNode.style.left = `${e.clientX - offsetX}px`
			rowNode.style.top = `${e.clientY - offsetY}px`

			rowNode.style.display = 'flex'
			rowNode.style.position = 'fixed'
			rowNode.style.zIndex = '999'

			const allRows = (
				Array.from(
					document.querySelectorAll(`[data-parent_id="${transaction.id}"]`)
				) as HTMLDivElement[]
			).map((node) => node.parentElement!.parentElement!) as HTMLDivElement[]

			const otherRows = allRows.filter((_, index) => index !== thisRowIndex)

			const breakpoints = otherRows.map(
				(node) => (node.childNodes[0] as HTMLDivElement).offsetTop
			)
			breakpoints.push(
				breakpoints.at(-1)! +
					(allRows.at(-1)!.childNodes[0] as HTMLDivElement).offsetHeight
			)

			let firstRun = true
			function putMarginGapOnRow(rowIndex: number | 'none') {
				// if ending the animation, remove transition effects
				if (rowIndex === 'none') {
					allRows.forEach((rowNode) => {
						;(Array.from(rowNode.childNodes) as HTMLDivElement[]).forEach(
							(cellNode) => {
								cellNode.classList.remove(s.transitions)
							}
						)
					})
				}
				// remove all current margin modifications
				allRows.forEach((rowNode) => {
					;(Array.from(rowNode.childNodes) as HTMLDivElement[]).forEach(
						(cellNode) => {
							cellNode.classList.remove(
								s.margin_top,
								s.margin_bottom,
								s.margin_top_double,
								s.margin_bottom_double,
								s.remove_border_radius,
								s.add_border_radius
							)
						}
					)
				})
				if (rowIndex === 'none') {
					return
				}

				rowIndex--

				if (rowIndex === -1) {
					;(Array.from(otherRows[0].childNodes) as HTMLDivElement[]).forEach(
						(cellNode) => cellNode.classList.add(s.margin_top_double)
					)
				}
				// if hovering over last row
				else if (rowIndex === transaction.items.length - 2) {
					;(Array.from(allRows.at(-1)!.childNodes) as HTMLDivElement[]).forEach(
						(cellNode) =>
							cellNode.classList.add(
								s.margin_bottom_double,
								s.remove_border_radius
							)
					)
					;(Array.from(rowNode.childNodes) as HTMLDivElement[]).forEach(
						(childNode) => childNode.classList.add(s.add_border_radius)
					)
				} else {
					otherRows[
						rowIndex
					].parentElement!.parentElement!.parentElement!.classList.add(
						s.margin_bottom
					)
					;(
						Array.from(otherRows[rowIndex].childNodes) as HTMLDivElement[]
					).forEach((cellNode) => cellNode.classList.add(s.margin_bottom))
					;(
						Array.from(otherRows[rowIndex + 1].childNodes) as HTMLDivElement[]
					).forEach((cellNode) => cellNode.classList.add(s.margin_top))
				}

				if (firstRun) {
					const delay = setTimeout(() => {
						allRows.forEach((rowNode) => {
							;(Array.from(rowNode.childNodes) as HTMLDivElement[]).forEach(
								(cellNode) => cellNode.classList.add(s.transitions)
							)
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
				rowNode.style.left = `${e.clientX - offsetX}px`
				rowNode.style.top = `${e.clientY - offsetY}px`

				const prevClosestBreakpointIndex = closestBreakpointIndex
				closestBreakpointIndex = getClosestBreakpointIndex(e.clientY)
				if (firstRun || prevClosestBreakpointIndex !== closestBreakpointIndex) {
					putMarginGapOnRow(closestBreakpointIndex)
				}
				firstRun = false
			}

			function handleReorderMouseUp() {
				putMarginGapOnRow('none')
				rowNode.childNodes.forEach((childNode) => {
					const node = childNode as HTMLDivElement
					node.style.width = ''
				})
				rowNode.style.display = ''
				rowNode.style.top = ''
				rowNode.style.left = ''
				rowNode.style.zIndex = ''
				rowNode.style.position = ''

				document.body.style.cursor = ''
				window.removeEventListener('mousemove', handleReorderMouseMove)
				window.removeEventListener('mouseup', handleReorderMouseUp)
				window.removeEventListener('contextmenu', handleRightClick)

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
				className={s.row_controller}
				data-parent_id={transaction.id}
				key={`${transaction.id}-${item.id}-1`}
			>
				<div onMouseDown={handleReorderMouseDown}>O</div>
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.first_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
				key={`${transaction.id}-${item.id}-2`}
			>
				<JDatePicker value={transaction.date} disabled minimalStyle />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
				key={`${transaction.id}-${item.id}-3`}
			>
				<JInput value={item.name} />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
				key={`${transaction.id}-${item.id}-4`}
			>
				<JNumberAccounting value={item.amount} data-rerender_tag={transaction.id} />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
				key={`${transaction.id}-${item.id}-5`}
			>
				<JDropdown
					options={dropdownOptionsCategory}
					value={item.category_id !== null ? item.category_id : 'none'}
				/>
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.last_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
				key={`${transaction.id}-${item.id}-7`}
			>
				<JDropdown
					options={dropdownOptionsAccount}
					value={item.account_id !== null ? item.account_id : 'none'}
				/>
			</div>,
		]
	})

	let uniqueCategories: string[] = []
	let uniqueAccounts: string[] = []
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

	const firstRow = [
		<div className={s.row_controller} key={`${transaction.id}-1`}></div>,
		<div
			className={`${s.data_container} ${s.multi_item} ${s.first_row} ${s.first_col}`}
			key={`${transaction.id}-2`}
		>
			<JDatePicker value={transaction.date} />
		</div>,
		<div
			className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}
			key={`${transaction.id}-3`}
		>
			<JInput value={transaction.name} />
		</div>,
		<div
			className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}
			key={`${transaction.id}-4`}
		>
			<JNumberAccounting value={sum} disabled minimalStyle />
		</div>,
		<div
			className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}
			key={`${transaction.id}-5`}
		>
			<JInput value={uniqueCategories.join(', ')} disabled minimalStyle />
		</div>,
		<div
			className={`${s.data_container} ${s.multi_item} ${s.last_col} ${s.first_row}`}
			key={`${transaction.id}-6`}
		>
			<JInput value={uniqueAccounts.join(', ')} disabled minimalStyle />
		</div>,
	]
	return [firstRow, ...nextRows]
}
