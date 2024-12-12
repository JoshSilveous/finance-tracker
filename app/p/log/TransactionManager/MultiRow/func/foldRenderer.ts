import { delay } from '@/utils'
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
		// columnNodes[1] is arbitrary, any columnNode will do
		const cells = Array.from(columnNodes[1].children) as HTMLDivElement[]
		const firstRowHeight =
			parseInt(getComputedStyle(cells[0]).height) +
			parseInt(getComputedStyle(columnNodes[1]).paddingTop) +
			parseInt(getComputedStyle(columnNodes[1]).paddingBottom)

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
		// columnNodes[1] is arbitrary, any columnNode will do
		const cells = Array.from(columnNodes[1].children) as HTMLDivElement[]
		const startingHeight = parseInt(getComputedStyle(columnNodes[1]).height)

		columnNodes.forEach((col) => {
			col.classList.remove(s.folded)
		})

		// calculate full height to return to
		// (cannot just set to 100%, animation won't play)
		let fullColHeight = 0
		cells.forEach((cell) => {
			fullColHeight += cell.clientHeight
		})
		const colStyle = getComputedStyle(columnNodes[0])
		fullColHeight += (cells.length - 1) * parseInt(colStyle.gap)
		fullColHeight += parseInt(colStyle.paddingTop)
		fullColHeight += parseInt(colStyle.paddingBottom)

		// apply new height animation
		columnNodes.forEach(async (col) => {
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			col.style.height = startingHeight + 'px'
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
