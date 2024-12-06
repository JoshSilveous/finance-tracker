import { FetchedTransaction } from '@/database'
import { typedQuerySelectAll } from '@/utils'

export function reorderMouseDownHandler(
	e: React.MouseEvent<HTMLInputElement>,
	item: FetchedTransaction['items'][number],
	itemIndex: number,
	transaction: FetchedTransaction,
	s: {
		readonly [key: string]: string
	},
	handleTransactionItemReorder: (oldIndex: number, newIndex: number) => void
) {
	/* sometimes, a <path> element is the target instead of the SVG, meaning that
    grabberNode is the <svg> instead of the parent <div>.
    this prevents that from creating a bug: */
	const grabberNode =
		(e.target as HTMLElement).tagName === 'svg'
			? ((e.target as SVGElement).parentElement as HTMLDivElement)
			: ((e.target as SVGElement).parentElement!.parentElement as HTMLDivElement)

	const grabberContainerNode = grabberNode.parentElement as HTMLDivElement
	const thisRow = typedQuerySelectAll<HTMLDivElement>(`[data-item_id="${item.id}"]`)

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
			widthOffset += 8
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
		return typedQuerySelectAll<HTMLDivElement>(`[data-item_id="${item.id}"]`)
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
			otherRows[rowIndex].forEach((node) => node.classList.add(s.margin_bottom))
			otherRows[rowIndex + 1].forEach((node) => node.classList.add(s.margin_top))
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
