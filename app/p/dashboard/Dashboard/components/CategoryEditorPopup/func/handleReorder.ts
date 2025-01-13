import { delay } from '@/utils'
import s from '../CategoryEditorPopup.module.scss'
import { MouseEvent, MutableRefObject } from 'react'
import { CatRowsRef } from '../CategoryEditorPopup'

export function handleReorder(
	category_id: string,
	catRowsRef: MutableRefObject<CatRowsRef>,
	sortOrder: string[],
	sortIndex: number,
	e: MouseEvent<HTMLButtonElement>,
	handleReorder: (oldIndex: number, newIndex: number) => void
) {
	document.body.style.cursor = 'grabbing'
	const rowRefsOrdered = sortOrder.map((cat_id) => ({
		...catRowsRef.current[cat_id],
		category_id: cat_id,
	}))
	const thisRef = rowRefsOrdered.find((it) => it.category_id === category_id)!
	const grabberNode = thisRef.reorderButton!
	const thisRow = Array.from(thisRef.container!.children) as HTMLDivElement[]
	const allRows = rowRefsOrdered.map(
		(ref) => Array.from(ref.container!.children) as HTMLDivElement[]
	)
	const otherRows = allRows.toSpliced(sortIndex, 1)
	const gridElem = thisRef.container!.parentNode!.parentNode!.parentNode as HTMLDivElement
	const computed = gridElem.getBoundingClientRect()
	const offsetX = computed.left + grabberNode.offsetLeft / 2 - 2
	const offsetY = computed.top - gridElem.offsetTop + grabberNode.offsetHeight / 2 + 10

	let leftOffset = 0
	const startWidths = thisRow.map((item) => item.offsetWidth)
	thisRow.forEach((node, index) => {
		node.style.width = `${startWidths[index]}px`
		node.style.left = `${e.clientX - offsetX + leftOffset}px`
		node.style.top = `${e.clientY - offsetY}px`
		node.classList.add(s.popped_out)
		leftOffset += node.clientWidth
	})

	const breakpoints: number[] = (() => {
		const arr = otherRows.map((row) => row[0].offsetTop - gridElem.offsetTop)
		arr.push(arr.at(-1)! + (allRows.at(-1)![0] as HTMLDivElement).offsetHeight)
		return arr
	})()

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
		else if (rowIndex === otherRows.length - 1) {
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
	let closestBreakpointIndex = getClosestBreakpointIndex(
		e.clientY + gridElem.scrollTop - computed.top
	)
	putMarginGapOnRow(closestBreakpointIndex)

	const SCROLL_MARGIN = 30 // margin from top/bottom of grid container to activate scrolling effect
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

	function handleReorderMouseMove(e: globalThis.MouseEvent) {
		let leftOffset = 0
		thisRow.forEach((node) => {
			node.style.left = `${e.clientX - offsetX + leftOffset}px`
			node.style.top = `${e.clientY - offsetY}px`
			leftOffset += node.clientWidth
		})

		const prevClosestBreakpointIndex = closestBreakpointIndex
		closestBreakpointIndex = getClosestBreakpointIndex(
			e.clientY + gridElem.scrollTop - computed.top
		)
		if (firstRun || prevClosestBreakpointIndex !== closestBreakpointIndex) {
			putMarginGapOnRow(closestBreakpointIndex)
		}
		firstRun = false

		if (e.clientY < computed.top + SCROLL_MARGIN) {
			scroll.startUp()
		} else {
			scroll.stopUp()
		}

		if (e.clientY > computed.top + computed.height - SCROLL_MARGIN) {
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
			node.classList.remove(s.popped_out)
		})

		scroll.stopUp()
		scroll.stopDown()

		if (sortIndex !== closestBreakpointIndex) {
			handleReorder(sortIndex, closestBreakpointIndex)
		}

		document.body.style.cursor = ''
		window.removeEventListener('mousemove', handleReorderMouseMove)
		window.removeEventListener('mouseup', handleReorderMouseUp)
		window.removeEventListener('contextmenu', handleRightClick)
		window.removeEventListener('keydown', handleKeyDown)
	}

	function handleRightClick(e: globalThis.MouseEvent) {
		e.preventDefault()

		window.removeEventListener('mousemove', handleReorderMouseMove)
		window.removeEventListener('mouseup', handleReorderMouseUp)
		window.removeEventListener('contextmenu', handleRightClick)
	}
	function handleKeyDown() {
		// cancel on key down
		closestBreakpointIndex = sortIndex
		handleReorderMouseUp()
	}
	window.addEventListener('mousemove', handleReorderMouseMove)
	window.addEventListener('mouseup', handleReorderMouseUp)
	window.addEventListener('contextmenu', handleRightClick)
	window.addEventListener('keydown', handleKeyDown)
}
