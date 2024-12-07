import { FetchedTransaction } from '@/database'
import { delay, typedQuerySelectAll } from '@/utils'
import s from './genMultiRow.module.scss'
import { Dispatch, SetStateAction } from 'react'

export function createFoldToggleHandler(
	folded: boolean,
	transaction: FetchedTransaction,
	transactionIndex: number,
	foldChangedBetweenRenders: boolean,
	setIsFoldedOrder: Dispatch<SetStateAction<boolean[]>>
) {
	let isFolded = folded
	function getColumnNodes() {
		return typedQuerySelectAll<HTMLDivElement>(
			`.${s.column}[data-transaction_id="${transaction.id}"]`
		)
	}

	const foldAnimationTime = 500
	let isFolding = false
	let cancelAnim: (() => void) | null = null

	console.log('foldChangedBetweenRenders', foldChangedBetweenRenders, 'folded', folded)
	function handleFoldToggle() {
		const toggleArrowNode = document.querySelector(
			`.${s.fold_toggle}[data-transaction_id="${transaction.id}"]`
		) as HTMLDivElement
		toggleArrowNode.style.transition = `scale 0.1s ease, color 0.1s ease, transform ${
			foldAnimationTime / 1000
		}s ease`

		if (isFolded) {
			toggleArrowNode.classList.remove(s.folded)
			if (isFolding === false) {
				unfold()
			} else {
				cancelAnim!()
				unfold()
			}
			isFolded = false
		} else {
			toggleArrowNode.classList.add(s.folded)
			if (isFolding === false) {
				fold()
			} else {
				cancelAnim!()
				fold()
			}
			isFolded = true
		}
	}

	// need a way to detect if the item is folded or not organically
	// then, everything can be controlled from the state. The button simply controls state

	function fold() {
		isFolding = true
		let cancelled = false
		cancelAnim = () => {
			cancelled = true
		}

		const cols = getColumnNodes()
		const firstRowHeight = document.querySelector(
			`.${s.first_row}[data-transaction_id="${transaction.id}"]`
		)!.clientHeight
		cols.forEach(async (col) => {
			const colStyle = getComputedStyle(col)
			const startingHeight = colStyle.height
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			col.style.height = startingHeight
			await delay(10)
			if (cancelled) {
				return
			}
			col.style.height = firstRowHeight + 'px'
			await delay(foldAnimationTime)
			if (cancelled) {
				return
			}
			col.style.height = ''
			col.classList.add(s.folded)
			isFolding = false
			cancelAnim = null
			setIsFoldedOrder((prev) =>
				prev.map((item, itemIndex) => (itemIndex === transactionIndex ? true : item))
			)
		})
	}

	function unfold() {
		isFolding = true
		let cancelled = false
		cancelAnim = () => {
			cancelled = true
		}

		const cells = typedQuerySelectAll<HTMLDivElement>(
			`.${s.column}.${s.date}[data-transaction_id="${transaction.id}"] > .${s.cell_container}`
		)
		const cols = getColumnNodes()
		const firstRowHeight = document.querySelector(
			`.${s.first_row}[data-transaction_id="${transaction.id}"]`
		)!.clientHeight

		cols.forEach((col) => {
			col.classList.remove(s.folded)
		})

		// calculate full height to return to
		// (cannot just set to 100%, animation won't play)
		let fullColHeight = 0
		cells.forEach((cell) => {
			fullColHeight += cell.clientHeight
		})
		const gapSize = parseInt(getComputedStyle(cols[0]).gap)
		fullColHeight += (cells.length - 1) * gapSize

		// apply new height animation
		cols.forEach(async (col) => {
			const startingHeight = firstRowHeight + 'px'
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			col.style.height = startingHeight
			await delay(10)
			if (cancelled) {
				return
			}
			col.style.height = fullColHeight + 'px'
			await delay(foldAnimationTime)
			if (cancelled) {
				return
			}
			col.style.height = ''
			isFolding = false
			cancelAnim = null
			setIsFoldedOrder((prev) =>
				prev.map((item, itemIndex) =>
					itemIndex === transactionIndex ? false : item
				)
			)
		})
	}

	return handleFoldToggle
}
