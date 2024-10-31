import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import s from './RowController.module.scss'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { createPopup } from '@/utils'
import { DeleteForm } from './DeleteForm/DeleteForm'
import { HistoryItem } from '../AccountManager'

interface RowControllerProps {
	account_id: string
	account_name: string
	deleteDisabled: boolean
	sortDisabled: boolean
	sortIndex: number
	currentSortOrder: string[]
	defaultSortOrder: string[]
	gridRowRefs: MutableRefObject<HTMLDivElement[]>
	setCurrentSortOrder: Dispatch<SetStateAction<string[]>>
	loadInitData: () => Promise<void>
	setUndoHistoryStack: Dispatch<SetStateAction<HistoryItem[]>>
	setRedoHistoryStack: Dispatch<SetStateAction<HistoryItem[]>>
}
export function RowController({
	account_id,
	account_name,
	deleteDisabled,
	sortDisabled,
	sortIndex,
	currentSortOrder,
	defaultSortOrder,
	gridRowRefs,
	setCurrentSortOrder,
	loadInitData,
	setUndoHistoryStack,
	setRedoHistoryStack,
}: RowControllerProps) {
	function handleReorderMouseDown(e: React.MouseEvent<HTMLInputElement>) {
		document.body.style.cursor = 'grabbing'

		const thisRowNode =
			gridRowRefs.current[sortIndex].parentElement!.parentElement!.parentElement!

		const grabberNode = e.currentTarget as HTMLDivElement
		const grabberContainerNode = thisRowNode.childNodes[0] as HTMLDivElement

		thisRowNode.childNodes.forEach((childNode) => {
			const node = childNode as HTMLDivElement
			node.style.width = `${node.offsetWidth}px`
		})
		const offsetX =
			grabberNode.offsetLeft +
			grabberNode.offsetWidth / 2 -
			grabberContainerNode.offsetLeft
		const offsetY =
			grabberNode.offsetTop +
			grabberNode.offsetHeight / 2 -
			grabberContainerNode.offsetTop

		thisRowNode.style.left = `${e.clientX - offsetX}px`
		thisRowNode.style.top = `${e.clientY - offsetY}px`

		thisRowNode.style.display = 'flex'
		thisRowNode.style.position = 'fixed'
		thisRowNode.style.zIndex = '999'

		const rowsWithoutCurrentRow = gridRowRefs.current.filter((_, i) => i !== sortIndex)
		const breakpoints: number[] = []
		gridRowRefs.current.forEach((row, index) => {
			if (index !== sortIndex) {
				breakpoints.push(row.offsetTop)
			}
		})

		breakpoints.push(breakpoints.at(-1)! + gridRowRefs.current.at(-1)!.offsetHeight)
		let firstRun = true
		function putMarginGapOnRow(rowIndex: number | 'none') {
			if (rowIndex === 'none') {
				gridRowRefs.current!.forEach((item) => {
					item.parentElement!.parentElement!.parentElement!.classList.remove(
						s.margin_transition
					)
				})
				gridRowRefs.current[0].parentElement!.parentElement!.parentElement!.parentElement!.parentElement!.classList.remove(
					s.margin_transition
				)
			}
			rowsWithoutCurrentRow[0].parentElement!.parentElement!.parentElement!.classList.remove(
				s.margin_top_double
			)
			rowsWithoutCurrentRow.forEach((item) => {
				item.parentElement!.parentElement!.parentElement!.classList.remove(
					s.margin_top
				)
				item.parentElement!.parentElement!.parentElement!.classList.remove(
					s.margin_bottom
				)
				item.parentElement!.parentElement!.parentElement!.parentElement!.parentElement!.classList.remove(
					s.margin_bottom_double
				)
			})
			if (rowIndex === 'none') {
				return
			}

			rowIndex--
			if (rowIndex === -1) {
				rowsWithoutCurrentRow[0].parentElement!.parentElement!.parentElement!.classList.add(
					s.margin_top_double
				)
			} else if (rowIndex === currentSortOrder!.length - 2) {
				gridRowRefs.current[
					rowIndex
				].parentElement!.parentElement!.parentElement!.parentElement!.parentElement!.classList.add(
					s.margin_bottom_double
				)
			} else {
				rowsWithoutCurrentRow[
					rowIndex
				].parentElement!.parentElement!.parentElement!.classList.add(s.margin_bottom)
				rowsWithoutCurrentRow[
					rowIndex + 1
				].parentElement!.parentElement!.parentElement!.classList.add(s.margin_top)
			}

			if (firstRun) {
				const delay = setTimeout(() => {
					rowsWithoutCurrentRow.forEach((item) => {
						item.parentElement!.parentElement!.parentElement!.classList.add(
							s.margin_transition
						)
					})
					gridRowRefs.current[0].parentElement!.parentElement!.parentElement!.parentElement!.parentElement!.classList.add(
						s.margin_transition
					)
					clearTimeout(delay)
				}, 10)
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

		let closestBreakpointIndex = getClosestBreakpointIndex(e.clientY)

		putMarginGapOnRow(sortIndex)
		function handleReorderMouseMove(e: MouseEvent) {
			thisRowNode.style.left = `${e.clientX - offsetX}px`
			thisRowNode.style.top = `${e.clientY - offsetY}px`

			const prevClosestBreakpointIndex = closestBreakpointIndex
			closestBreakpointIndex = getClosestBreakpointIndex(e.clientY)
			if (firstRun || prevClosestBreakpointIndex !== closestBreakpointIndex) {
				putMarginGapOnRow(closestBreakpointIndex)
			}
			firstRun = false
		}
		function handleReorderMouseUp() {
			putMarginGapOnRow('none')
			thisRowNode.childNodes.forEach((childNode) => {
				const node = childNode as HTMLDivElement
				node.style.width = ''
			})
			thisRowNode.style.display = ''
			thisRowNode.style.top = ''
			thisRowNode.style.left = ''
			thisRowNode.style.zIndex = ''
			thisRowNode.style.position = ''

			if (closestBreakpointIndex !== sortIndex) {
				setUndoHistoryStack((prev) => [
					...prev,
					{
						action: 'reorder',
						oldIndex: sortIndex,
						newIndex: closestBreakpointIndex,
					},
				])
				setRedoHistoryStack([])
				setCurrentSortOrder((prev) => {
					const newArr = [...prev!]
					const [item] = newArr.splice(sortIndex, 1)
					newArr.splice(closestBreakpointIndex, 0, item)
					return newArr
				})
			}

			document.body.style.cursor = ''
			window.removeEventListener('mousemove', handleReorderMouseMove)
			window.removeEventListener('mouseup', handleReorderMouseUp)
			window.removeEventListener('contextmenu', handleRightClick)
		}
		window.addEventListener('mousemove', handleReorderMouseMove)
		window.addEventListener('mouseup', handleReorderMouseUp)
		window.addEventListener('contextmenu', handleRightClick)
		function handleRightClick(e: MouseEvent) {
			e.preventDefault()
			window.removeEventListener('mousemove', handleReorderMouseMove)
			window.removeEventListener('mouseup', handleReorderMouseUp)
			window.removeEventListener('contextmenu', handleRightClick)
		}
	}

	async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
		;(e.target as HTMLButtonElement).blur()
		const myPopup = createPopup(
			<DeleteForm
				account_id={account_id}
				account_name={account_name}
				afterDelete={() => {
					myPopup.close()
					loadInitData()
				}}
			/>
		)
		myPopup.trigger()
	}

	return (
		<div
			className={`${s.row_controls_container} ${
				account_id !== defaultSortOrder![sortIndex] ? s.changed : ''
			}`}
			ref={(elem) => {
				if (elem !== null) {
					gridRowRefs.current[sortIndex] = elem as HTMLDivElement
				}
			}}
		>
			<button
				className={s.delete_button}
				onClick={handleDelete}
				disabled={deleteDisabled}
				title={deleteDisabled ? 'Save or discard changes before deleting' : ''}
			>
				<DeleteIcon />
			</button>
			{!sortDisabled && (
				<div className={s.reorder_grabber} onMouseDown={handleReorderMouseDown}>
					<ReorderIcon />
				</div>
			)}
		</div>
	)
}
