import { FetchedTransaction } from '@/database'
import s from '../TransactionManager.module.scss'
import genMultiRowStyles from './genMultiRow/genMultiRow.module.scss'
import genSingleRowStyles from './genSingleRow/genSingleRow.module.scss'
import { typedQuerySelectAll, delay } from '@/utils'

export function handleTransactionReorderMouseDown(
	e: React.MouseEvent<HTMLDivElement>,
	allTransactions: FetchedTransaction[],
	transaction: FetchedTransaction,
	transactionIndex: number,
	updateTransactionSortOrder: (oldIndex: number, newIndex: number) => void,
	fold?: () => boolean,
	unfold?: () => boolean
) {
	function getTransactionRow(transaction: FetchedTransaction) {
		const isMultiRow = transaction.items.length > 1
		let cssQuery = ''
		if (isMultiRow) {
			cssQuery = `.${genMultiRowStyles.column}[data-transaction_id="${transaction.id}"]`
		} else {
			cssQuery = `.${genSingleRowStyles.cell_container}[data-transaction_id="${transaction.id}"]`
		}
		return typedQuerySelectAll<HTMLDivElement>(cssQuery)
	}

	// if this is a multi-row, force it to fold while popped out
	let forceFolded = false
	if (transaction.items.length > 1) {
		forceFolded = fold!()
	}

	const thisRowIndex = transactionIndex
	const thisRow = getTransactionRow(transaction)
	const allRows = allTransactions.map((transaction) => getTransactionRow(transaction))
	const otherRows = allRows.filter((_, index) => index !== thisRowIndex)

	const grabberNode = e.currentTarget as HTMLDivElement

	const offsetX =
		grabberNode.offsetWidth / 2 + grabberNode.offsetLeft + 2 - thisRow[0].offsetLeft
	const offsetY =
		grabberNode.offsetHeight / 2 + grabberNode.offsetTop + 2 - thisRow[0].offsetTop

	const breakpoints = otherRows.map((row, rowIndex) => {
		if (forceFolded && rowIndex >= transactionIndex) {
			const unfoldedHeight = thisRow[0].offsetHeight
			const foldedHeight = document.querySelector(
				`.${genMultiRowStyles.first_row}[data-transaction_id="${transaction.id}"]`
			)!.clientHeight

			return row[0].offsetTop - unfoldedHeight + foldedHeight
		} else {
			return row[0].offsetTop
		}
	})
	breakpoints.push(
		breakpoints.at(-1)! + (allRows.at(-1)![0] as HTMLDivElement).offsetHeight
	)

	let leftOffset = 0
	thisRow.forEach((node) => {
		node.style.width = `${node.offsetWidth}px`
		node.style.left = `${e.clientX - offsetX + leftOffset}px`
		node.style.top = `${e.clientY - offsetY}px`
		node.classList.add(s.popped_out)
		leftOffset += node.clientWidth
	})

	let firstRun = true
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
					s.margin_bottom_double
				)
			})
		})
		if (rowIndex === 'none') {
			return
		}

		rowIndex--

		// if hovering over first row
		if (rowIndex === -1) {
			otherRows[0].forEach((node) => {
				node.classList.add(s.margin_top_double)
			})
		}
		// if hovering over last row
		else if (rowIndex === allTransactions.length - 2) {
			otherRows.at(-1)!.forEach((node) => {
				node.classList.add(s.margin_bottom_double)
			})
		} else {
			otherRows[rowIndex].forEach((node) => node.classList.add(s.margin_bottom))
			otherRows[rowIndex + 1].forEach((node) => node.classList.add(s.margin_top))
		}

		if (firstRun) {
			delay(10).then(() => {
				allRows.forEach((row) => {
					row.forEach((node) => {
						node.classList.add(s.transitions)
					})
				})
			})
		}
	}

	function getClosestBreakpointIndex(yPos: number) {
		return breakpoints.reduce((closestIndex, currentValue, currentIndex) => {
			return Math.abs(currentValue - yPos) < Math.abs(breakpoints[closestIndex] - yPos)
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

		if (thisRowIndex !== closestBreakpointIndex) {
			updateTransactionSortOrder(thisRowIndex, closestBreakpointIndex)
		}

		// if this is a multi-row that was forced to fold, unfold it
		if (forceFolded) {
			unfold!()
		}
	}
	window.addEventListener('mousemove', handleReorderMouseMove)
	window.addEventListener('mouseup', handleReorderMouseUp)
}
