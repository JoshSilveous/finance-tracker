import { DashboardController, Data } from '@/app/p/dashboard/Dashboard/hooks'
import { delay } from '@/utils'
import s from '../../../TransactionManager.module.scss'

export const handleReorderMouseDown =
	(
		transaction: Data.StateTransaction,
		transactionIndex: number,
		sortOrder: DashboardController['sortOrder'],
		processReorder: (oldIndex: number, newIndex: number) => void
	) =>
	(e: React.MouseEvent) => {
		const trnSortOrder = sortOrder.cur[transaction.date.orig].map((it) => it[0])

		const allRowElems = trnSortOrder.map((id) => {
			return document.querySelector(
				`[data-transaction_row_id="${id}"]`
			) as HTMLDivElement
		})
		const thisRowElem = document.querySelector(
			`[data-transaction_row_id="${transaction.id}"]`
		) as HTMLDivElement

		const thisRowChildren = Array.from(thisRowElem.children) as HTMLDivElement[]

		const otherRowElems = allRowElems.toSpliced(allRowElems.indexOf(thisRowElem), 1)

		const gridElem = thisRowElem.parentElement as HTMLDivElement

		const grabberNode = e.currentTarget as HTMLButtonElement
		console.log(thisRowElem)

		const offsetX = grabberNode.offsetLeft + grabberNode.offsetWidth / 2 - 4
		const offsetY = grabberNode.offsetHeight * 1.5 - 2

		const topOffset = gridElem.getBoundingClientRect().top

		const colStyle = getComputedStyle(thisRowChildren[1])
		const gapHeight = parseInt(colStyle.getPropertyValue('--gap-row-height'))

		let calculatedRowHeight = 0

		calculatedRowHeight = thisRowChildren[1].offsetHeight

		document.body.style.cursor = 'grabbing'
		const breakpoints: number[] = (() => {
			const arr = otherRowElems.map((row, index) => {
				return (row.children[0] as HTMLDivElement).offsetTop - gapHeight / 2
			})
			arr.push(
				arr.at(-1)! +
					(allRowElems.at(-1)!.children[0] as HTMLDivElement).offsetHeight
			)
			return arr
		})()

		let leftOffset = 0
		const startWidths = thisRowChildren.map((item) => getComputedStyle(item).width)
		thisRowChildren.forEach((node, nodeIndex) => {
			node.style.width = startWidths[nodeIndex]
			node.style.left = `${e.clientX - offsetX + leftOffset}px`
			node.style.top = `${e.clientY - offsetY}px`
			node.classList.add(s.popped_out)
			if (nodeIndex === 0 || nodeIndex === thisRowChildren.length - 2) {
				node.classList.add(s.drop_shadow)
			}
			leftOffset += node.clientWidth
		})

		let firstRun = true
		const marginSize = calculatedRowHeight + gapHeight
		function putMarginGapOnRow(rowIndex: number | 'none') {
			// if ending the animation, remove transition effects
			if (rowIndex === 'none') {
				allRowElems.forEach((rowElem) => {
					;(Array.from(rowElem.children) as HTMLDivElement[]).forEach((node) => {
						node.classList.remove(s.transitions)
					})
				})
			}
			// remove all current margin modifications
			allRowElems.forEach((rowElem) => {
				;(Array.from(rowElem.children) as HTMLDivElement[]).forEach((node) => {
					node.style.marginTop = ''
					node.style.marginBottom = '0px'
				})
			})
			if (rowIndex === 'none') {
				return
			}

			// if hovering over first row
			if (rowIndex === 0) {
				;(Array.from(otherRowElems[0].children) as HTMLDivElement[]).forEach(
					(node) => {
						node.style.marginTop = marginSize + 'px'
					}
				)
			}
			// if hovering over last row
			else if (rowIndex === otherRowElems.length) {
				;(Array.from(otherRowElems.at(-1)!.children) as HTMLDivElement[]).forEach(
					(node) => {
						node.style.marginBottom = marginSize + 'px'
					}
				)
			} else {
				;(
					Array.from(otherRowElems[rowIndex - 1].children) as HTMLDivElement[]
				).forEach((node) => (node.style.marginBottom = marginSize / 2 + 'px'))
				;(Array.from(otherRowElems[rowIndex].children) as HTMLDivElement[]).forEach(
					(node) => (node.style.marginTop = marginSize / 2 + 'px')
				)
			}

			if (firstRun) {
				delay(10).then(() => {
					allRowElems.forEach((row) => {
						;(Array.from(row.children) as HTMLDivElement[]).forEach((node) => {
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
			thisRowChildren.forEach((node, nodeIndex) => {
				node.style.left = `${e.clientX - offsetX + leftOffset}px`
				node.style.top = `${e.clientY - offsetY}px`
				node.classList.add(s.popped_out)
				if (nodeIndex === 0 || nodeIndex === thisRowChildren.length - 2) {
					node.classList.add(s.drop_shadow)
				}
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
			thisRowChildren.forEach((node) => {
				node.style.width = ''
				node.style.top = ''
				node.style.left = ''
				node.classList.remove(s.popped_out)
			})

			scroll.stopUp()
			scroll.stopDown()

			document.body.style.cursor = ''
			window.removeEventListener('mousemove', handleReorderMouseMove)
			window.removeEventListener('mouseup', handleReorderMouseUp)

			if (transactionIndex !== closestBreakpointIndex) {
				processReorder(transactionIndex, closestBreakpointIndex)
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
