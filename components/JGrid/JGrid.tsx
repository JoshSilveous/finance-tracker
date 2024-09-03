'use client'
import { useState } from 'react'
import styles from './JGrid.module.scss'
export interface JGridProps {
	headers: JSX.Element[]
	content: JSX.Element[][]
	defaultColumnWidths: string[]
	style?: React.CSSProperties
	className?: string
	noOuterBorders?: boolean
	minColumnWidth?: number
}

export function JGrid({
	headers,
	content,
	defaultColumnWidths,
	style,
	className,
	noOuterBorders,
	minColumnWidth,
}: JGridProps) {
	const [columnWidths, setColumnWidths] = useState(defaultColumnWidths)
	const [isResizing, setIsResizing] = useState(false)

	const Headers = (
		<div className={styles.row}>
			{headers.map((itemCell, index) => {
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
						{itemCell}
					</div>
				)
			})}
		</div>
	)
	const MeasurementSelectors = headers.map((_item, index) => {
		function handleMouseDown(e: React.MouseEvent) {
			setIsResizing(true)
			;(e.target as HTMLDivElement).classList.add(styles.resizing)

			const startX = e.screenX
			const startWidth = (e.target as HTMLDivElement).parentElement!.clientWidth

			function handleMouseMove(e: MouseEvent) {
				const curX = e.screenX
				const diffX = curX - startX

				setColumnWidths((prev) => {
					const newArr = [...prev]
					newArr[index] =
						Math.max(minColumnWidth ? minColumnWidth : 50, startWidth + diffX) + 'px'
					return newArr
				})

				window.addEventListener('mouseup', handleMouseUp)
			}

			function handleMouseUp() {
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

	const Content = content.map((itemRow, itemRowIndex) => {
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
								borderBottomWidth: isBottomRow && noOuterBorders ? '0px' : '',
								borderRightWidth: isRightColumn && noOuterBorders ? '0px' : '',
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
					gridTemplateColumns: columnWidths.join(' '),
					userSelect: isResizing ? 'none' : 'auto',
					cursor: isResizing ? 'e-resize' : '',
					borderWidth: noOuterBorders ? '0px' : '',
				}}
			>
				{Headers}
				{MeasurementSelectors} {Content}
			</div>
		</div>
	)
}
