import { FetchedTransaction } from '@/database'
import s from '../TransactionManager.module.scss'
import { delay } from '@/utils'
import { MutableRefObject } from 'react'
import {
	FoldStateUpdater,
	StateTransaction,
	TransactionRowsRef,
} from '../TransactionManager'

export const handleTransactionReorder =
	(
		otherTransactions: StateTransaction[],
		transaction: StateTransaction,
		transactionIndex: number,
		updateTransactionSortOrder: (oldIndex: number, newIndex: number) => void,
		transactionRowsRef: MutableRefObject<TransactionRowsRef>,
		folded: boolean,
		/**
		 * See {@link FoldStateUpdater}
		 */
		updateFoldState: FoldStateUpdater
	) =>
	(e: React.MouseEvent<HTMLDivElement>) => {
		function getTransactionRow(transaction: StateTransaction) {
			const rowNode = transactionRowsRef.current[transaction.id]!
			const childNodes = Array.from(rowNode.childNodes) as HTMLDivElement[]
			return childNodes
		}

		const thisRowIndex = transactionIndex
		const thisRow = getTransactionRow(transaction)
		const allRows = otherTransactions.map((transaction) =>
			getTransactionRow(transaction)
		)
		const otherRows = allRows.filter(
			(item) => item[0].dataset['transaction_id'] !== transaction.id
		)

		let forceFolded = false
		if (transaction.items.length > 1 && !folded) {
			updateFoldState(transaction.id, true)
			forceFolded = true
		}

		const grabberNode = e.currentTarget as HTMLDivElement

		const offsetX =
			grabberNode.offsetWidth / 2 + grabberNode.offsetLeft - thisRow[0].offsetLeft
		const offsetY =
			grabberNode.offsetHeight / 2 + grabberNode.offsetTop + 8 - thisRow[0].offsetTop

		const colStyle = getComputedStyle(thisRow[1])
		const gapHeight = parseInt(colStyle.getPropertyValue('--gap-row-height'))

		const originalRowHeight = parseInt(colStyle.height)
		let calculatedRowHeight = 0
		if (forceFolded) {
			const firstRowCell = thisRow[1].children[0] as HTMLDivElement
			calculatedRowHeight += firstRowCell.offsetHeight
			calculatedRowHeight += parseInt(colStyle.paddingTop)
			calculatedRowHeight += parseInt(colStyle.paddingBottom)
		} else {
			calculatedRowHeight = thisRow[1].offsetHeight
		}

		const breakpoints = otherRows.map((row, index) => {
			if (forceFolded && index > thisRowIndex - 1) {
				return (
					row[0].offsetTop -
					originalRowHeight +
					calculatedRowHeight -
					gapHeight / 2
				)
			}
			return row[0].offsetTop - gapHeight / 2
		})
		breakpoints.push(
			breakpoints.at(-1)! + (allRows.at(-1)![0] as HTMLDivElement).offsetHeight
		)

		let leftOffset = 0
		const startWidths = thisRow.map((item) => getComputedStyle(item).width)
		thisRow.forEach((node, nodeIndex) => {
			node.style.width = startWidths[nodeIndex]
			node.style.left = `${e.clientX - offsetX + leftOffset}px`
			node.style.top = `${e.clientY - offsetY}px`
			node.classList.add(s.popped_out)
			if (nodeIndex === 0) {
				node.classList.add(s.row_controller)
			}
			leftOffset += node.clientWidth
		})

		let firstRun = true
		const marginSize = calculatedRowHeight + gapHeight
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
					node.style.marginBottom = '0px'
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
			else if (rowIndex === otherTransactions.length - 2) {
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
				return Math.abs(currentValue - yPos) <
					Math.abs(breakpoints[closestIndex] - yPos)
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

			if (forceFolded) {
				updateFoldState(transaction.id, false)
			}
		}
		window.addEventListener('mousemove', handleReorderMouseMove)
		window.addEventListener('mouseup', handleReorderMouseUp)
	}
