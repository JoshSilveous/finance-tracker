import { delay, typedQuerySelectAll } from '@/utils'
import s from '../MultiRow.module.scss'

/**
 * Generates an instance used to present different fold effects to the user.
 * Run `cancel()` when MultiRow component unmounts to prevent overlaps when multiple actions are done with quick succession
 */
export function foldRenderer(columnNodes: HTMLDivElement[], transaction_id: string) {
	const foldAnimationTime = 500

	let cancelled = false
	function cancel() {
		cancelled = true
	}

	function fold() {
		columnNodes.forEach((col) => {
			col.classList.add(s.folded)
			col.style.transition = ''
			col.style.height = ''
		})
	}

	function unfold() {
		columnNodes.forEach((col) => {
			col.style.transition = ''
			col.classList.remove(s.folded)
			col.style.display = ''
			col.style.height = ''
		})
	}

	function foldAnimated() {
		const firstRowHeight = document.querySelector(
			`.${s.first_row}[data-transaction_id="${transaction_id}"]`
		)!.clientHeight
		columnNodes.forEach(async (col) => {
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			const colStyle = getComputedStyle(col)
			const startingHeight = colStyle.height
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
			col.style.transition = ''
			col.classList.add(s.folded)
		})
	}

	function unfoldAnimated() {
		const cells = typedQuerySelectAll<HTMLDivElement>(
			`.${s.column}.${s.date}[data-transaction_id="${transaction_id}"] > .${s.cell_container}`
		)
		const firstRowHeight = document.querySelector(
			`.${s.first_row}[data-transaction_id="${transaction_id}"]`
		)!.clientHeight

		columnNodes.forEach((col) => {
			col.classList.remove(s.folded)
		})

		// calculate full height to return to
		// (cannot just set to 100%, animation won't play)
		let fullColHeight = 0
		cells.forEach((cell) => {
			fullColHeight += cell.clientHeight
		})
		const gapSize = parseInt(getComputedStyle(columnNodes[0]).gap)
		fullColHeight += (cells.length - 1) * gapSize

		// apply new height animation
		columnNodes.forEach(async (col) => {
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			const startingHeight = firstRowHeight + 'px'
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
			col.style.transition = ''
		})
	}

	return { cancel, fold, unfold, foldAnimated, unfoldAnimated }
}
