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
			<JDatePicker defaultValue={transaction.date} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JInput defaultValue={transaction.name} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JNumberAccounting defaultValue={transactionItem.amount} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JDropdown
				options={dropdownOptionsCategory}
				defaultValue={
					transactionItem.category_id !== null
						? transactionItem.category_id
						: undefined
				}
			/>
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.last_col}`}>
			<JDropdown
				options={dropdownOptionsAccount}
				defaultValue={
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
	console.log('GEN MULTIROW RAN WITH', transaction)
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
			<div className={s.row_controller} data-parent_id={transaction.id}>
				<div onMouseDown={handleReorderMouseDown}>O</div>
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.first_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JDatePicker defaultValue={transaction.date} disabled minimalStyle />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JInput defaultValue={item.name} />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JNumberAccounting defaultValue={item.amount} />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JDropdown
					options={dropdownOptionsCategory}
					defaultValue={item.category_id !== null ? item.category_id : 'none'}
				/>
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.last_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JDropdown
					options={dropdownOptionsAccount}
					defaultValue={item.account_id !== null ? item.account_id : 'none'}
				/>
			</div>,
		]
	})

	let categoryList = ''
	let accountList = ''
	transaction.items.forEach((item) => {
		if (item.category_id !== null) {
			const categoryName = categories.find((cat) => cat.id === item.category_id)!.name
			if (categoryList === '') {
				categoryList += categoryName
			} else {
				categoryList += ', ' + categoryName
			}
		}
		if (item.account_id !== null) {
			const accountName = accounts.find((act) => act.id === item.account_id)!.name
			if (accountList === '') {
				accountList += accountName
			} else {
				accountList += ', ' + accountName
			}
		}
	})

	const firstRow = [
		<div className={s.row_controller}></div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.first_row} ${s.first_col}`}>
			<JDatePicker defaultValue={transaction.date} />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}>
			<JInput defaultValue={transaction.name} />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}>
			<JNumberAccounting defaultValue={sum} disabled minimalStyle />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}>
			<JInput defaultValue={categoryList} disabled minimalStyle />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.last_col} ${s.first_row}`}>
			<JInput defaultValue={accountList} disabled minimalStyle />
		</div>,
	]
	return [firstRow, ...nextRows]
}
