'use client'
import { useEffect, useRef, useState } from 'react'
import s from './JGrid.module.scss'

export namespace JGridTypes {
	/**
	 * Content for the first row of the JGrid, and width properties for each column
	 */
	export interface Header {
		content: JSX.Element
		minWidth?: number
		maxWidth?: number
		defaultWidth: number
		noResize?: boolean
	}
	export type Cell = JSX.Element | { content: JSX.Element; style?: React.CSSProperties }
	export type Row = JSX.Element
	export interface Props {
		headers: Header[]
		/**
		 * `cells` is an array of the data displayed in the grid. This is a two-dimensional array, composed of rows and their cells.
		 *
		 * **There are two ways a row can be packaged:**
		 *
		 * 1. {@link JGridTypes.Cell `JGridTypes.Cell[]`}
		 * An array of either `JSX.Element`s, or objects packaged like this:
		 * `
		 * { content: JSX.Element; style?: React.CSSProperties }
		 * `
		 * The `style` property applies to the cell container, allowing multi-row cells using the `gridColumn` CSS property.
		 * &nbsp;
		 *
		 *
		 * 2. {@link JGridTypes.Row `JGridTypes.Row`}
		 * A single `JSX.Element`, which should contain a {@link React.Fragment `React.Fragment`} with several cells as children (or make sure the container's `display` property is set to `contents`). This allows a row to be a React Component.
		 * <u>Default JGrid styles do not apply here and will need to be manually configured (such as `gridColumn`)</u>
		 *
		 * @example
		 * // a standard array of cells
		 * const row1 = [ <div>John</div>, <div>Smith</div> ]
		 *
		 * // a single cell that spans two columns
		 * const row2 = [{ content: <div>John Smith</div>, style: { gridColumn = "1 / 3" } }]
		 *
		 * // a single component that has two cells, with a fragment container
		 * const row3 = <>
		 *     <div style={{ gridColumn = "1 / 2" }}>John</div>
		 *     <div style={{ gridColumn = "2 / 3" }}>Smith</div>
		 * </>
		 *
		 * // a single component that has two cells, with a container with `display: contents`
		 * const row4 = <div style={{ display: "contents" }}>
		 *     <div style={{ gridColumn = "1 / 2" }}>John</div>
		 *     <div style={{ gridColumn = "2 / 3" }}>Smith</div>
		 * </div>
		 *
		 * const cells: JGridTypes.props["cells"] = [row1, row2, row3, row4]
		 *
		 */
		cells: (Cell[] | Row)[]
		style?: React.CSSProperties
		className?: string
		noOuterBorders?: boolean
		noBorders?: boolean
		minColumnWidth?: number
		maxTableWidth?: number
		onResize?: ColumnResizeEventHandler
	}
	export type ColumnResizeEventHandler = (e: ColumnResizeEvent) => void
	export interface ColumnResizeEvent {
		columnIndex: number
		newWidth: number
	}
}

export function JGrid({
	headers,
	cells,
	style,
	className,
	noOuterBorders,
	noBorders,
	maxTableWidth,
	onResize,
}: JGridTypes.Props) {
	const [columnWidths, setColumnWidths] = useState(
		headers.map((header) => header.defaultWidth)
	)
	const columnWidthsRef = useRef(columnWidths)
	const [isResizing, setIsResizing] = useState(false)
	useEffect(() => {
		columnWidthsRef.current = columnWidths
	}, columnWidths)

	const headersJSX = (
		<div className={s.row}>
			{headers.map((header, index) => {
				const isRightColumn = index === headers.length - 1
				return (
					<div
						key={index}
						className={`${s.cell} ${s.header}`}
						style={{
							gridColumn: `${index + 1} / ${index + 2}`,
							borderRightWidth: isRightColumn && noOuterBorders ? '0px' : '',
						}}
					>
						{header.content}
					</div>
				)
			})}
		</div>
	)

	const measurementSelectorsJSX = headers.map((header, index) => {
		if (header.noResize) {
			return (
				<div
					className={s.measurer}
					key={index}
					style={{ gridColumn: `${index + 1} / ${index + 2}` }}
				/>
			)
		}

		function beginResize(startX: number, target: HTMLDivElement) {
			setIsResizing(true)

			target.classList.add(s.resizing)

			const startWidth = target.parentElement!.clientWidth
			let prevColWidths = [...columnWidths]

			function resize(curX: number) {
				const diffX = curX - startX
				const newAttemptedWidth = startWidth + diffX

				// prevent resizing column above header.maxWidth (if defined)
				if (header.maxWidth !== undefined && newAttemptedWidth > header.maxWidth) {
					return
				}

				// prevent resizing column below header.minWidth (if defined)
				if (header.minWidth !== undefined && newAttemptedWidth < header.minWidth) {
					return
				}

				// if maxTableWidth is defined...
				if (maxTableWidth !== undefined) {
					let newAttemptedTableWidth = 0
					columnWidths.forEach((colWidth, colIndex) => {
						if (colIndex === index) {
							newAttemptedTableWidth += newAttemptedWidth
						} else {
							newAttemptedTableWidth += colWidth
						}
					})
					// if user is trying to exceed maxTableWidth...
					if (newAttemptedTableWidth > maxTableWidth) {
						// if there's a column to the right, shrink it (if available)
						if (index !== columnWidths.length - 1) {
							setColumnWidths((prev) => {
								const newArr = [...prev]
								if (headers[index + 1].noResize !== true) {
									const trueDiff = prev[index] - newAttemptedWidth
									const nextNodePrevWidth = prev[index + 1]
									const nextNodeNewWidth = nextNodePrevWidth + trueDiff
									const nextNodeMinWidth = headers[index + 1].minWidth
									if (
										!(
											nextNodeMinWidth !== undefined &&
											nextNodeNewWidth < nextNodeMinWidth
										)
									) {
										newArr[index] = newAttemptedWidth
										newArr[index + 1] = nextNodeNewWidth
									}
								}
								return newArr
							})
							return
						}
						// if there's no column to the right, prevent resizing beyond maxTableWidth
						else {
							return
						}
					}
				}

				// if no restrictions are being exceeded...
				setColumnWidths((prev) => {
					const newArr = [...prev]
					newArr[index] = newAttemptedWidth
					return newArr
				})
			}

			function handleMouseMove(e: MouseEvent) {
				resize(e.screenX)
			}
			function handleTouchMove(e: TouchEvent) {
				resize(e.touches[0].screenX)
			}

			function endResize() {
				if (onResize !== undefined) {
					columnWidthsRef.current.forEach((colWidth, index) => {
						if (colWidth !== prevColWidths[index]) {
							onResize({ columnIndex: index, newWidth: colWidth })
						}
					})
				}

				target.classList.remove(s.resizing)
				setIsResizing(false)

				window.removeEventListener('mousemove', handleMouseMove)
				window.removeEventListener('touchmove', handleTouchMove)
				window.removeEventListener('mouseup', endResize)
				window.removeEventListener('touchend', endResize)
				window.removeEventListener('touchcancel', endResize)
			}

			window.addEventListener('mousemove', handleMouseMove)
			window.addEventListener('touchmove', handleTouchMove)
			window.addEventListener('mouseup', endResize)
			window.addEventListener('touchend', endResize)
			window.addEventListener('touchcancel', endResize)
		}
		function handleTouchDown(e: React.TouchEvent) {
			const startX = e.touches[0].screenX
			const target = e.target as HTMLDivElement
			beginResize(startX, target)
		}
		function handleMouseDown(e: React.MouseEvent) {
			const startX = e.screenX
			const target = e.target as HTMLDivElement
			beginResize(startX, target)
		}

		return (
			<div
				className={s.measurer}
				key={index}
				style={{ gridColumn: `${index + 1} / ${index + 2}` }}
			>
				<div
					className={s.grabber}
					onMouseDown={handleMouseDown}
					onTouchStart={handleTouchDown}
				></div>
			</div>
		)
	})

	const contentJSX = cells.map((itemRow, itemRowIndex) => {
		if (Array.isArray(itemRow)) {
			return (
				<div className={s.row} key={itemRowIndex}>
					{itemRow.map((itemCell, itemCellIndex) => {
						const isBottomRow = itemRowIndex === cells.length - 1
						const isRightColumn = itemCellIndex === itemRow.length - 1

						/**
						 * Detects if `itemCell` is a `JSX.Element` or `{ content: JSX.Element, style?: React.CSSProperties }`
						 */
						const isCustomCell = 'content' in itemCell

						const style: React.CSSProperties = {
							gridColumn: `${itemCellIndex + 1} / ${itemCellIndex + 2}`,
							borderBottomWidth: isBottomRow && noOuterBorders ? '0px' : '',
							borderRightWidth: isRightColumn && noOuterBorders ? '0px' : '',
						}

						return (
							<div
								className={s.cell}
								key={itemCellIndex}
								style={
									isCustomCell ? { ...style, ...itemCell.style } : style
								}
							>
								{isCustomCell ? itemCell.content : itemCell}
							</div>
						)
					})}
				</div>
			)
		} else {
			return itemRow
		}
	})
	return (
		<div
			className={`${s.container} ${className ? className : ''}`}
			style={style ? style : {}}
		>
			<div
				className={`${s.grid} ${noBorders ? s.no_borders : ''}`}
				style={{
					gridTemplateColumns: columnWidths.map((val) => `${val}px`).join(' '),
					userSelect: isResizing ? 'none' : 'auto',
					cursor: isResizing ? 'e-resize' : '',
					borderWidth: noOuterBorders ? '0px' : '',
				}}
			>
				{headersJSX}
				{measurementSelectorsJSX} {contentJSX}
			</div>
		</div>
	)
}
