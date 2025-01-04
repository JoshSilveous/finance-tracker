import { delay } from '@/utils'
import multiRowStyles from '../../../TransactionManager/components/MultiRow/MultiRow.module.scss'
import { MutableRefObject } from 'react'
import { ItemRowsRef } from '../../../TransactionManager/components'
import { Data } from '../useData'

export function itemReorderMouseEffect(
	item: Data.StateTransaction['items'][number],
	itemRowsRef: MutableRefObject<ItemRowsRef>,
	itemIndex: number,
	e: MouseEvent,
	handleTransactionItemReorder: (oldIndex: number, newIndex: number) => void
) {
	const grabberNode = (e.currentTarget as HTMLButtonElement)
		.parentElement as HTMLDivElement
	const grabberContainerNode = grabberNode.parentElement as HTMLDivElement
	const allRows = itemRowsRef.current.map((ref) => ref.cells)
	const thisRow = itemRowsRef.current.find((ref) => ref.item_id === item.id)!.cells
	const otherRows = allRows.filter((_, index) => index !== itemIndex)!

	const gridElem = itemRowsRef.current[0].cells[0]?.parentNode?.parentNode?.parentNode
		?.parentNode?.parentNode as HTMLDivElement

	const offsetX =
		grabberNode.offsetLeft +
		grabberNode.offsetWidth / 2 -
		grabberContainerNode.offsetLeft -
		2
	const offsetY = grabberNode.offsetHeight / 2 + 13

	const topOffset = gridElem.getBoundingClientRect().top

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
		node.classList.add(multiRowStyles.popped_out)
		leftOffset += node.clientWidth
	})

	const breakpoints: number[] = (() => {
		const arr = otherRows.map((row) => row[0].offsetTop)

		arr.push(arr.at(-1)! + (allRows.at(-1)![0] as HTMLDivElement).offsetHeight)
		return arr
	})()

	let firstRun = true
	function putMarginGapOnRow(rowIndex: number | 'none') {
		// if ending the animation, remove transition effects
		if (rowIndex === 'none') {
			allRows.forEach((rowNodes) => {
				rowNodes.forEach((node) => {
					node.classList.remove(multiRowStyles.transitions)
				})
			})
		}
		// remove all current margin modifications
		allRows.forEach((rowNodes) => {
			rowNodes.forEach((node) => {
				node.classList.remove(
					multiRowStyles.margin_top,
					multiRowStyles.margin_bottom,
					multiRowStyles.margin_top_double,
					multiRowStyles.margin_bottom_double
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
				node.classList.add(multiRowStyles.margin_top_double)
			})
		}
		// if hovering over last row
		else if (rowIndex === otherRows.length - 1) {
			otherRows.at(-1)!.forEach((node) => {
				node.classList.add(multiRowStyles.margin_bottom_double)
			})
		} else {
			otherRows[rowIndex].forEach((node) =>
				node.classList.add(multiRowStyles.margin_bottom)
			)
			otherRows[rowIndex + 1].forEach((node) =>
				node.classList.add(multiRowStyles.margin_top)
			)
		}

		if (firstRun) {
			delay(10).then(() => {
				allRows.forEach((row) => {
					row.forEach((node) => {
						node.classList.add(multiRowStyles.transitions)
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
	let closestBreakpointIndex = getClosestBreakpointIndex(
		e.clientY + gridElem.scrollTop - topOffset
	)
	putMarginGapOnRow(closestBreakpointIndex)

	const SCROLL_MARGIN = 50 // margin from top/bottom of grid container to activate scrolling effect
	const SCROLL_SPEED_PER_SEC = 200
	const SPEED_UP_AFTER_SEC = 0.5
	const SPEED_UP_MULTIPLIER = 2

	const scroll = (() => {
		let isScrollingUp = false
		let isScrollingDown = false

		return {
			startUp: async () => {
				if (!isScrollingUp) {
					isScrollingUp = true

					let isSpedUp = false
					delay(SPEED_UP_AFTER_SEC * 1000).then(() => {
						isSpedUp = true
					})

					do {
						if (isSpedUp) {
							gridElem.scrollTop -=
								(SCROLL_SPEED_PER_SEC / 100) * SPEED_UP_MULTIPLIER
						} else {
							gridElem.scrollTop -= SCROLL_SPEED_PER_SEC / 100
						}
						await delay(10)
					} while (isScrollingUp)
				}
			},
			stopUp: () => {
				isScrollingUp = false
			},
			startDown: async () => {
				if (!isScrollingDown) {
					isScrollingDown = true

					let isSpedUp = false
					delay(SPEED_UP_AFTER_SEC * 1000).then(() => {
						isSpedUp = true
					})

					do {
						if (isSpedUp) {
							gridElem.scrollTop +=
								(SCROLL_SPEED_PER_SEC / 100) * SPEED_UP_MULTIPLIER
						} else {
							gridElem.scrollTop += SCROLL_SPEED_PER_SEC / 100
						}
						await delay(10)
					} while (isScrollingDown)
				}
			},
			stopDown: () => {
				isScrollingDown = false
			},
		}
	})()

	function handleReorderMouseMove(e: MouseEvent) {
		let leftOffset = 0

		thisRow.forEach((node) => {
			node.style.left = `${e.clientX - offsetX + leftOffset}px`
			node.style.top = `${e.clientY - offsetY}px`
			leftOffset += node.clientWidth
		})

		const prevClosestBreakpointIndex = closestBreakpointIndex
		closestBreakpointIndex = getClosestBreakpointIndex(
			e.clientY + gridElem.scrollTop - topOffset
		)
		if (firstRun || prevClosestBreakpointIndex !== closestBreakpointIndex) {
			putMarginGapOnRow(closestBreakpointIndex)
		}
		firstRun = false

		if (e.clientY < gridElem.offsetTop + topOffset + SCROLL_MARGIN) {
			scroll.startUp()
		} else {
			scroll.stopUp()
		}

		if (
			e.clientY >
			gridElem.offsetTop + topOffset + gridElem.offsetHeight - SCROLL_MARGIN
		) {
			scroll.startDown()
		} else {
			scroll.stopDown()
		}
	}

	function handleReorderMouseUp() {
		putMarginGapOnRow('none')
		thisRow.forEach((node) => {
			node.style.width = ''
			node.style.top = ''
			node.style.left = ''
			node.classList.remove(multiRowStyles.popped_out)
		})

		scroll.stopUp()
		scroll.stopDown()

		document.body.style.cursor = ''
		window.removeEventListener('mousemove', handleReorderMouseMove)
		window.removeEventListener('mouseup', handleReorderMouseUp)
		window.removeEventListener('contextmenu', handleRightClick)
		window.removeEventListener('keydown', handleKeyDown)

		if (itemIndex !== closestBreakpointIndex) {
			handleTransactionItemReorder(itemIndex, closestBreakpointIndex)
		}
	}

	function handleRightClick(e: MouseEvent) {
		e.preventDefault()

		window.removeEventListener('mousemove', handleReorderMouseMove)
		window.removeEventListener('mouseup', handleReorderMouseUp)
		window.removeEventListener('contextmenu', handleRightClick)
	}
	function handleKeyDown(e: KeyboardEvent) {
		// cancel on key down
		closestBreakpointIndex = itemIndex
		handleReorderMouseUp()
	}
	window.addEventListener('mousemove', handleReorderMouseMove)
	window.addEventListener('mouseup', handleReorderMouseUp)
	window.addEventListener('contextmenu', handleRightClick)
	window.addEventListener('keydown', handleKeyDown)
}
