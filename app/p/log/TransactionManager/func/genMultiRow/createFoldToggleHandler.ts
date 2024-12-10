import { FetchedTransaction } from '@/database'
import { delay, typedQuerySelectAll } from '@/utils'
import s from './genMultiRow.module.scss'
import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { FoldState } from '../../TransactionManager'

export function createFoldToggleHandler(
	/**
	 * Controls whether or not the multi-item appears folded
	 */
	folded: boolean,
	/**
	 * The transaction used to generate this row. MUST be a multi-row (`transaction.items.length > 1`)
	 */
	transaction: FetchedTransaction,
	/**
	 * If true, a fold/unfold animation will be played to accompany the `folded` value provided
	 */
	playAnimation: boolean,

	/**
	 * Used to update state when folded/unfolded via toggle button
	 */
	setFoldStateArr: Dispatch<SetStateAction<FoldState[]>>,
	/**
	 * Used to compare ref when running animation to determine if animation should be cancelled
	 */
	prevIsFoldedOrderRef: MutableRefObject<FoldState[] | null>
) {
	const foldAnimationTime = 500
	if (folded && playAnimation) {
		renderFoldAnimated()
	} else if (!folded && playAnimation) {
		renderUnfoldAnimated()
	} else if (folded && !playAnimation) {
		// renderFold()
		/* fold state is rendered in genMultiRow when `columns` is defined (by adding s.folded class manually).
		this is necessary instead of defining here because querySelector can select old data on re-renders. */
	} else if (!folded && !playAnimation) {
		renderUnfold()
	}

	function getColumnNodes() {
		return typedQuerySelectAll<HTMLDivElement>(
			`.${s.column}[data-transaction_id="${transaction.id}"]`
		)
	}

	function handleFoldToggle() {
		setFoldStateArr((prev) => {
			const newArr = structuredClone(prev)
			const thisItemIndex = newArr.findIndex(
				(item) => item.transaction_id === transaction.id
			)
			newArr[thisItemIndex].folded = !newArr[thisItemIndex].folded
			return newArr
		})
	}

	/**
	 * Checks against ref to see if fold state has changed (used to cancel async animations when fold is toggled before animation finished)
	 */
	function checkIfAnimCancelled() {
		const latestRefValue = prevIsFoldedOrderRef.current!.find(
			(item) => item.transaction_id === transaction.id
		)?.folded
		if ((folded && latestRefValue === false) || (!folded && latestRefValue === true)) {
			return true
		}
		return false
	}

	function renderFoldAnimated() {
		const cols = getColumnNodes()
		const firstRowHeight = document.querySelector(
			`.${s.first_row}[data-transaction_id="${transaction.id}"]`
		)!.clientHeight
		cols.forEach(async (col) => {
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			const colStyle = getComputedStyle(col)
			const startingHeight = colStyle.height
			col.style.height = startingHeight
			await delay(10)
			if (checkIfAnimCancelled()) {
				return
			}
			col.style.height = firstRowHeight + 'px'
			await delay(foldAnimationTime)
			if (checkIfAnimCancelled()) {
				return
			}
			col.style.height = ''
			col.style.transition = ''
			col.classList.add(s.folded)
		})
	}
	function renderUnfoldAnimated() {
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
			col.style.transition = `height ${foldAnimationTime / 1000}s ease`
			const startingHeight = firstRowHeight + 'px'
			col.style.height = startingHeight
			await delay(10)
			if (checkIfAnimCancelled()) {
				return
			}
			col.style.height = fullColHeight + 'px'
			await delay(foldAnimationTime)
			if (checkIfAnimCancelled()) {
				return
			}
			col.style.height = ''
			col.style.transition = ''
		})
	}
	// function renderFold() {
	// 	const cols = getColumnNodes()
	// 	cols.forEach(async (col) => {
	// 		col.classList.add(s.folded)
	// 		col.style.transition = ``
	// 		col.style.height = ''
	// 	})
	// }
	function renderUnfold() {
		const cols = getColumnNodes()

		cols.forEach(async (col) => {
			col.style.transition = ``
			col.classList.remove(s.folded)
			col.style.display = ''
			col.style.height = ''
		})
	}

	return handleFoldToggle
}
