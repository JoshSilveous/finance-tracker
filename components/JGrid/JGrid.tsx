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
		function handleMouseDown(e: React.MouseEvent) {
			setIsResizing(true)
			;(e.target as HTMLDivElement).classList.add(styles.resizing)

			const startX = e.screenX
			const startWidth = (e.target as HTMLDivElement).parentElement!.clientWidth
			let prevColWidths = [...columnWidths]

			function handleMouseMove(e: MouseEvent) {
				const curX = e.screenX
				const diffX = curX - startX
				const newAttemptedWidth = startWidth + diffX
				console.log('newAttemptedWidth', newAttemptedWidth)

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
						// if there's a column to the right, shrink it
						if (index !== columnWidths.length - 1) {
							setColumnWidths((prev) => {
								const newArr = [...prev]

								const trueDiff = prev[index] - newAttemptedWidth
								const nextNodePrevWidth = prev[index + 1]
								const nextNodeNewWidth = nextNodePrevWidth + trueDiff
								if (
									headers[index].minWidth
										? nextNodeNewWidth > headers[index].minWidth
										: nextNodeNewWidth > 50
								) {
									newArr[index] = newAttemptedWidth
									newArr[index + 1] = nextNodeNewWidth
								}
								return newArr
							})
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

				window.addEventListener('mouseup', handleMouseUp)
			}

			function handleMouseUp() {
				if (onResize !== undefined) {
					columnWidthsRef.current.forEach((colWidth, index) => {
						if (colWidth !== prevColWidths[index]) {
							onResize({ columnIndex: index, newWidth: colWidth })
						}
					})
				}

				;(e.target as HTMLDivElement).classList.remove(styles.resizing)
				setIsResizing(false)

				window.removeEventListener('mousemove', handleMouseMove)
				window.removeEventListener('mouseup', handleMouseUp)
			}

			window.addEventListener('mousemove', handleMouseMove)
			window.addEventListener('mouseup', handleMouseUp)
		}

		return (
			<div
				className={styles.measurer}
				key={index}
				style={{ gridColumn: `${index + 1} / ${index + 2}` }}
			>
				<div className={styles.grabber} onMouseDown={handleMouseDown}></div>
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
