'use client'
import { useEffect, useRef, useState } from 'react'
import s from './JGrid.module.scss'
import { calculatePercentages } from '@/utils'

export function JGrid(p: JGridTypes.Props) {
	const defaultWidthsPx = p.headers.map((header) => header.defaultWidth)
	const totalWidthInPx = defaultWidthsPx.reduce((sum, num) => sum + num, 0)

	const noResizeArr = p.headers.map((header) => header.noResize)

	const defaultWidthsPcnt = calculatePercentages(defaultWidthsPx, totalWidthInPx)
	const minColWidthsPcnt = calculatePercentages(
		[...p.headers.map((header) => header.minWidth)],
		totalWidthInPx
	)
	const maxColWidthsPcnt = calculatePercentages(
		[...p.headers.map((header) => header.maxWidth)],
		totalWidthInPx
	)

	const [columnWidths, setColumnWidths] = useState(
		p.useFullWidth ? defaultWidthsPcnt : defaultWidthsPx
	)
	const columnWidthsRef = useRef(columnWidths)
	const [isResizing, setIsResizing] = useState(false)
	useEffect(() => {
		columnWidthsRef.current = columnWidths
	}, columnWidths)

	const headersJSX = (
		<div className={s.row}>
			{p.headers.map((header, index) => {
				const isRightColumn = index === p.headers.length - 1
				return (
					<div
						key={index}
						className={`${s.cell} ${s.header} ${
							p.stickyHeaders ? s.sticky : ''
						}`}
						style={{
							gridColumn: `${index + 1} / ${index + 2}`,
							borderRightWidth: isRightColumn && p.noOuterBorders ? '0px' : '',
						}}
					>
						{header.content}
					</div>
				)
			})}
		</div>
	)

	const measurementSelectorsJSX = p.headers.map((header, index) => {
		if (header.noResize) {
			return (
				<div
					className={`${s.measurer} ${p.stickyHeaders ? s.sticky : ''}`}
					key={index}
					style={{ gridColumn: `${index + 1} / ${index + 2}` }}
				/>
			)
		}

		function beginResize(startX: number, target: HTMLDivElement) {
			setIsResizing(true)

			target.classList.add(s.resizing)

			const startWidth = target.parentElement!.clientWidth
			let prevColWidths = [...columnWidthsRef.current]

			function resize(curX: number) {
				if (p.useFullWidth) {
					const deltaX = curX - startX
					setColumnWidths((prevWidths) => {
						const newWidths = [...prevColWidths]
						let percentageDelta = (deltaX / window.innerWidth) * 100

						const oldWidth = newWidths[index]
						// Calculate new width for the column
						let newWidth = oldWidth + percentageDelta

						// console.log(
						// 	'\noldWidth',
						// 	oldWidth,
						// 	'\nnewWidth',
						// 	newWidth,
						// 	'\nminWidth',
						// 	minColWidthsPcnt[index],
						// 	'\nmaxWidth',
						// 	maxColWidthsPcnt[index]
						// )

						if (
							maxColWidthsPcnt[index] !== undefined &&
							newWidth > maxColWidthsPcnt[index]
						) {
							return prevWidths
						} else if (
							minColWidthsPcnt[index] !== undefined &&
							newWidth < minColWidthsPcnt[index]
						) {
							return prevWidths
						}

						const neighborIndex = (() => {
							let findNeighborAttempts = 0
							function findAvailableNeighbor(
								index: number,
								forwards: boolean
							) {
								if (findNeighborAttempts > newWidths.length) {
									return null
								}

								const neighborIndex = forwards ? index + 1 : index - 1
								const curNeighborWidth = newWidths[neighborIndex]
								const newNeighborWidth = curNeighborWidth - percentageDelta
								const minNeighborWidth = minColWidthsPcnt[neighborIndex]
								const maxNeighborWidth = maxColWidthsPcnt[neighborIndex]
								if (
									(maxNeighborWidth !== undefined &&
										newNeighborWidth > maxNeighborWidth) ||
									(minNeighborWidth !== undefined &&
										newNeighborWidth < minNeighborWidth) ||
									noResizeArr[neighborIndex]
								) {
									findNeighborAttempts++
									if (forwards && neighborIndex === newWidths.length - 1) {
										return findAvailableNeighbor(neighborIndex, false)
									} else if (!forwards && neighborIndex === 0) {
										return findAvailableNeighbor(neighborIndex, true)
									} else {
										return findAvailableNeighbor(neighborIndex, forwards)
									}
								} else {
									return neighborIndex
								}
							}
							return index === newWidths.length
								? findAvailableNeighbor(index, false)
								: findAvailableNeighbor(index, true)
						})()

						if (neighborIndex === null) {
							return prevWidths
						}
						newWidths[neighborIndex] -= percentageDelta

						newWidths[index] = newWidth
						console.log(
							'old:',
							structuredClone(prevWidths),
							'new:',
							structuredClone(newWidths)
						)
						return newWidths
					})
				} else {
					const diffX = curX - startX
					const newAttemptedWidth = startWidth + diffX

					// prevent resizing column above header.maxWidth (if defined)
					if (
						header.maxWidth !== undefined &&
						newAttemptedWidth > header.maxWidth
					) {
						return
					}

					// prevent resizing column below header.minWidth (if defined)
					if (
						header.minWidth !== undefined &&
						newAttemptedWidth < header.minWidth
					) {
						return
					}

					// if maxTableWidth is defined...
					if (p.maxTableWidth !== undefined) {
						let newAttemptedTableWidth = 0
						columnWidths.forEach((colWidth, colIndex) => {
							if (colIndex === index) {
								newAttemptedTableWidth += newAttemptedWidth
							} else {
								newAttemptedTableWidth += colWidth
							}
						})
						// if user is trying to exceed maxTableWidth...
						if (newAttemptedTableWidth > p.maxTableWidth) {
							// if there's a column to the right, shrink it (if available)
							if (index !== columnWidths.length - 1) {
								setColumnWidths((prev) => {
									const newArr = [...prev]
									if (p.headers[index + 1].noResize !== true) {
										const trueDiff = prev[index] - newAttemptedWidth
										const nextNodePrevWidth = prev[index + 1]
										const nextNodeNewWidth = nextNodePrevWidth + trueDiff
										const nextNodeMinWidth =
											p.headers[index + 1].minWidth
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
			}

			function handleMouseMove(e: MouseEvent) {
				resize(e.screenX)
			}
			function handleTouchMove(e: TouchEvent) {
				resize(e.touches[0].screenX)
			}

			function endResize() {
				if (p.onResize !== undefined) {
					columnWidthsRef.current.forEach((colWidth, index) => {
						if (colWidth !== prevColWidths[index]) {
							p.onResize!({ columnIndex: index, newWidth: colWidth })
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
				className={`${s.measurer} ${p.stickyHeaders ? s.sticky : ''}`}
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

	const contentJSX = p.cells.map((itemRow, itemRowIndex) => {
		if (Array.isArray(itemRow)) {
			return (
				<div className={s.row} key={itemRowIndex}>
					{itemRow.map((itemCell, itemCellIndex) => {
						const isBottomRow = itemRowIndex === p.cells.length - 1
						const isRightColumn = itemCellIndex === itemRow.length - 1

						/**
						 * Detects if `itemCell` is a `JSX.Element` or `{ content: JSX.Element, style?: React.CSSProperties }`
						 */
						const isCustomCell = 'content' in itemCell

						const style: React.CSSProperties = {
							gridColumn: `${itemCellIndex + 1} / ${itemCellIndex + 2}`,
							borderBottomWidth: isBottomRow && p.noOuterBorders ? '0px' : '',
							borderRightWidth: isRightColumn && p.noOuterBorders ? '0px' : '',
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

	const gridTemplateColumns = (() => {
		if (p.useFullWidth) {
			return columnWidths
				.map((width, index) => {
					if (noResizeArr[index]) {
						return `${defaultWidthsPx[index]}px`
					} else {
						// Convert percentage widths to fractional units (fr)
						const totalResizablePercentage = columnWidths.reduce(
							(sum, w, i) => (noResizeArr[i] ? sum : sum + w),
							0
						)
						return `${(width / totalResizablePercentage) * 1}fr`
					}
				})
				.join(' ')
		} else {
			return columnWidths.map((val) => `${val}px`).join(' ')
		}
	})()
	return (
		<div
			className={`${s.container} ${p.className ? p.className : ''}`}
			style={p.style ? p.style : {}}
		>
			<div
				className={`${s.grid} ${p.noBorders ? s.no_borders : ''}`}
				style={{
					gridTemplateColumns: gridTemplateColumns,
					userSelect: isResizing ? 'none' : 'auto',
					cursor: isResizing ? 'e-resize' : undefined,
					borderWidth: p.noOuterBorders ? '0px' : undefined,
					width: p.useFullWidth ? '100%' : undefined,
				}}
			>
				{headersJSX}
				{measurementSelectorsJSX} {contentJSX}
			</div>
		</div>
	)
}

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
		stickyHeaders?: boolean
		/**
		 * When enabled, table width will always take up the entire container. `defaultWidth`s, `maxWidth`s, and `minWidth`s provided in headers will be taken as percentages of a whole, not their actual px values. Headers defined with `noResize` will keep their px value.
		 */
		useFullWidth?: boolean
	}
	export type ColumnResizeEventHandler = (e: ColumnResizeEvent) => void
	export interface ColumnResizeEvent {
		columnIndex: number
		newWidth: number
	}
}
