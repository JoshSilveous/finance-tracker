'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './JGrid.module.scss'

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
	export interface Props {
		headers: Header[]
		content: JSX.Element[][]
		style?: React.CSSProperties
		className?: string
		noOuterBorders?: boolean
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
	content,
	style,
	className,
	noOuterBorders,
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
		<div className={styles.row}>
			{headers.map((header, index) => {
				const isRightColumn = index === headers.length - 1
				return (
					<div
						key={index}
						className={`${styles.cell} ${styles.header}`}
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
					className={styles.measurer}
					key={index}
					style={{ gridColumn: `${index + 1} / ${index + 2}` }}
				/>
			)
		}

		function beginResize(startX: number, target: HTMLDivElement) {
			setIsResizing(true)

			target.classList.add(styles.resizing)

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

				target.classList.remove(styles.resizing)
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
				className={styles.measurer}
				key={index}
				style={{ gridColumn: `${index + 1} / ${index + 2}` }}
			>
				<div
					className={styles.grabber}
					onMouseDown={handleMouseDown}
					onTouchStart={handleTouchDown}
				></div>
			</div>
		)
	})

	const contentJSX = content.map((itemRow, itemRowIndex) => {
		return (
			<div className={styles.row} key={itemRowIndex}>
				{itemRow.map((itemCell, itemCellIndex) => {
					const isBottomRow = itemRowIndex === content.length - 1
					const isRightColumn = itemCellIndex === itemRow.length - 1
					return (
						<div
							className={styles.cell}
							key={itemCellIndex}
							style={{
								gridColumn: `${itemCellIndex + 1} / ${itemCellIndex + 2}`,
								borderBottomWidth:
									isBottomRow && noOuterBorders ? '0px' : '',
								borderRightWidth:
									isRightColumn && noOuterBorders ? '0px' : '',
							}}
						>
							{itemCell}
						</div>
					)
				})}
			</div>
		)
	})
	return (
		<div
			className={`${styles.container} ${className ? className : ''}`}
			style={style ? style : {}}
		>
			<div
				className={styles.grid}
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
