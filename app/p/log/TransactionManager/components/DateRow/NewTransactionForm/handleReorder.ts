import { Dispatch, SetStateAction } from 'react'
import { TransactionFormData } from './NewTransactionForm'
import s from './NewTransactionForm.module.scss'
import { delay, moveItemInArray } from '@/utils'

export const handleReorder =
	(
		formData: TransactionFormData,
		setFormData: Dispatch<SetStateAction<TransactionFormData>>,
		itemRows: HTMLDivElement[],
		thisRowIndex: number
	) =>
	(e: React.MouseEvent<HTMLButtonElement>) => {
		const grabberNode = e.currentTarget as HTMLButtonElement
		const grabberContainerNode = grabberNode.parentElement as HTMLDivElement

		const allRows = itemRows.map(
			(itemRow) => Array.from(itemRow.children) as HTMLDivElement[]
		)
		const thisRow = allRows[thisRowIndex]
		const otherRows = allRows.filter((_, index) => index !== thisRowIndex)!
		const gridElem = allRows[0][0].parentNode?.parentNode?.parentNode as HTMLDivElement
		const popupContainer = gridElem.parentNode?.parentNode?.parentNode
			?.parentNode as HTMLDivElement
		const popupContainerStyles = getComputedStyle(popupContainer)
		console.log('popupContainer', popupContainer)
		const popupContainerOffsetX =
			parseInt(popupContainerStyles.left) -
			parseInt(popupContainerStyles.width) / 2 -
			20
		const popupContainerOffsetY =
			parseInt(popupContainerStyles.top) -
			parseInt(popupContainerStyles.height) / 2 -
			20

		const offsetX =
			grabberNode.offsetLeft +
			grabberNode.offsetWidth / 2 -
			grabberContainerNode.offsetLeft
		const offsetY =
			grabberNode.offsetTop +
			grabberNode.offsetHeight / 2 -
			grabberContainerNode.offsetTop
		console.log(
			'popupContainerOffsetX',
			popupContainerOffsetX,
			'\nopopupContainerOffsetY',
			popupContainerOffsetY,
			'new',
			popupContainer.offsetLeft,
			popupContainer.offsetTop
		)

		let leftOffset = 0
		const rowWidths = thisRow.map((node) => parseInt(getComputedStyle(node).width))
		// console.log(thisRow.map((item, index) => [item, rowWidths[index]]))
		thisRow.forEach((node, index) => {
			// patches for minor visual issues. after a few hours, i decided it wasn't worth the time troubleshooting the css for this

			node.style.width = `${rowWidths[index]}px`
			node.style.left = `${e.clientX - popupContainerOffsetX - offsetX + leftOffset}px`
			node.style.top = `${e.clientY - popupContainerOffsetY - offsetY}px`
			node.classList.add(s.popped_out)
			leftOffset += rowWidths[index]
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
			else if (rowIndex === formData.items.length - 2) {
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
				return Math.abs(currentValue - yPos) <
					Math.abs(breakpoints[closestIndex] - yPos)
					? currentIndex
					: closestIndex
			}, 0)
		}
		let closestBreakpointIndex = getClosestBreakpointIndex(
			e.clientY - popupContainerOffsetY + gridElem.scrollTop
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
			const trueX = e.clientX - popupContainerOffsetX
			const trueY = e.clientY - popupContainerOffsetY
			let leftOffset = 0
			thisRow.forEach((node, index) => {
				node.style.left = `${trueX - offsetX + leftOffset}px`
				node.style.top = `${trueY - offsetY}px`
				leftOffset += rowWidths[index]
			})

			const prevClosestBreakpointIndex = closestBreakpointIndex
			closestBreakpointIndex = getClosestBreakpointIndex(trueY + gridElem.scrollTop)
			if (firstRun || prevClosestBreakpointIndex !== closestBreakpointIndex) {
				putMarginGapOnRow(closestBreakpointIndex)
			}
			firstRun = false

			if (trueY < gridElem.offsetTop + SCROLL_MARGIN) {
				scroll.startUp()
			} else {
				scroll.stopUp()
			}

			if (trueY > gridElem.offsetTop + gridElem.offsetHeight - SCROLL_MARGIN) {
				scroll.startDown()
			} else {
				scroll.stopDown()
			}
		}

		function handleReorderMouseUp() {
			putMarginGapOnRow('none')
			// thisRow.forEach((node) => {
			// 	node.style.width = ''
			// 	node.style.top = ''
			// 	node.style.left = ''
			// 	node.classList.remove(s.popped_out)
			// })

			scroll.stopUp()
			scroll.stopDown()

			document.body.style.cursor = ''
			window.removeEventListener('mousemove', handleReorderMouseMove)
			window.removeEventListener('mouseup', handleReorderMouseUp)
			window.removeEventListener('contextmenu', handleRightClick)

			if (thisRowIndex !== closestBreakpointIndex) {
				setFormData((prev) => {
					const clone = structuredClone(prev)
					moveItemInArray(clone.items, thisRowIndex, closestBreakpointIndex)
					return clone
				})
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
