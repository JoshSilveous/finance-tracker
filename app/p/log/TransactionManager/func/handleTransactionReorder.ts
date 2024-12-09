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
	updateTransactionSortOrder: (oldIndex: number, newIndex: number) => void
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

	const thisRowIndex = transactionIndex
	const thisRow = getTransactionRow(transaction)
	const allRows = allTransactions.map((transaction) => getTransactionRow(transaction))
	const otherRows = allRows.filter(
		(item) => item[0].dataset['transaction_id'] !== transaction.id
	)

	const grabberNode = e.currentTarget as HTMLDivElement

	const offsetX =
		grabberNode.offsetWidth / 2 + grabberNode.offsetLeft + 2 - thisRow[0].offsetLeft
	const offsetY =
		grabberNode.offsetHeight / 2 + grabberNode.offsetTop + 2 - thisRow[0].offsetTop

	const breakpoints = otherRows.map((row) => row[0].offsetTop)
	breakpoints.push(
		breakpoints.at(-1)! + (allRows.at(-1)![0] as HTMLDivElement).offsetHeight
	)

	let leftOffset = 0
	thisRow.forEach((node) => {
		const nodeStyle = getComputedStyle(node)
		console.log('node:', node, 'width:', nodeStyle.width)
		node.style.width = nodeStyle.width
		node.style.left = `${e.clientX - offsetX + leftOffset}px`
		node.style.top = `${e.clientY - offsetY}px`
		node.classList.add(s.popped_out)
		leftOffset += node.clientWidth
	})

	let firstRun = true
	const marginSize = thisRow[0].offsetHeight
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
				node.style.marginTop = ''
				node.style.marginBottom = ''
			})
		})
		if (rowIndex === 'none') {
			return
		}

		rowIndex--

		// if hovering over first row
		if (rowIndex === -1) {
			otherRows[0].forEach((node) => {
				node.style.marginTop = marginSize + 'px'
			})
		}
		// if hovering over last row
		else if (rowIndex === allTransactions.length - 2) {
			otherRows.at(-1)!.forEach((node) => {
				node.style.marginBottom = marginSize + 'px'
			})
		} else {
			otherRows[rowIndex].forEach(
				(node) => (node.style.marginBottom = marginSize / 2 + 'px')
			)
			otherRows[rowIndex + 1].forEach(
				(node) => (node.style.marginTop = marginSize / 2 + 'px')
			)
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
		const test = breakpoints.reduce((closestIndex, currentValue, currentIndex) => {
			return Math.abs(currentValue - yPos) < Math.abs(breakpoints[closestIndex] - yPos)
				? currentIndex
				: closestIndex
		}, 0)
		return test
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
	}
	window.addEventListener('mousemove', handleReorderMouseMove)
	window.addEventListener('mouseup', handleReorderMouseUp)
}
