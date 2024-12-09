import { FetchedTransaction } from '@/database'
import { delay, typedQuerySelectAll } from '@/utils'
import s from './genMultiRow.module.scss'
import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { FoldState } from '../../TransactionManager'

export function createFoldToggleHandler(
	folded: boolean,
	transaction: FetchedTransaction,
	transactionIndex: number,
	playAnimation: boolean,
	setIsFoldedOrder: Dispatch<SetStateAction<FoldState[]>>,
	prevIsFoldedOrderRef: MutableRefObject<FoldState[] | null>
) {
	const foldAnimationTime = 500
	if (folded && playAnimation) {
		renderFoldAnimation()
	} else if (!folded && playAnimation) {
		renderUnfoldAnimation()
	} else if (folded && !playAnimation) {
		renderFold()
	} else if (!folded && !playAnimation) {
		renderUnfold()
	}

	async function getColumnNodes() {
		await delay(10)
		return typedQuerySelectAll<HTMLDivElement>(
			`.${s.column}[data-transaction_id="${transaction.id}"]`
		)
	}

	function handleFoldToggle() {
		setIsFoldedOrder((prev) => {
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

	async function renderFoldAnimation() {
		const cols = await getColumnNodes()
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
			col.classList.add(s.folded)
		})
	}
	async function renderUnfoldAnimation() {
		const cells = typedQuerySelectAll<HTMLDivElement>(
			`.${s.column}.${s.date}[data-transaction_id="${transaction.id}"] > .${s.cell_container}`
		)
		const cols = await getColumnNodes()
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
			if (checkIfAnimCancelled()) {
				return
			}
			col.style.height = fullColHeight + 'px'
			await delay(foldAnimationTime)
			if (checkIfAnimCancelled()) {
				return
			}
			col.style.height = ''
		})
	}
	async function renderFold() {
		const cols = await getColumnNodes()
		cols.forEach(async (col) => {
			col.classList.add(s.folded)
			col.style.transition = ``
			col.style.height = ''
		})
	}
	async function renderUnfold() {
		const cols = await getColumnNodes()

		cols.forEach(async (col) => {
			col.style.transition = ``
			col.classList.remove(s.folded)
			col.style.height = ''
		})
	}

	return handleFoldToggle
}
