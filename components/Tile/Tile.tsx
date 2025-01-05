import React, { useRef, useEffect, ReactNode, HTMLAttributes, useLayoutEffect } from 'react'
import s from './tile.module.scss'
import { default as ResizeHandle } from '@/public/resize_handle.svg'
import { default as RepositionHandle } from '@/public/reposition_handle.svg'
import { default as EditIcon } from '@/public/edit_icon.svg'

interface TileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onResize'> {
	children: ReactNode
	resizable?: boolean
	onResize?: (width: number, height: number) => void
	onReposition: (top: number, left: number) => void
	minWidth?: number
	minHeight?: number
	maxWidth?: number
	maxHeight?: number
	defaultWidth: number
	defaultHeight: number
	defaultPosLeft: number
	defaultPosTop: number
	showEditButton?: boolean
	onEditButtonClick?: () => void
}

export function Tile({
	children,
	resizable,
	onResize,
	minWidth = 100,
	minHeight = 100,
	maxWidth,
	defaultWidth,
	defaultHeight,
	onReposition,
	maxHeight,
	defaultPosLeft,
	defaultPosTop,
	className,
	showEditButton,
	onEditButtonClick,
	...rest
}: TileProps) {
	const wrapperRef = useRef<HTMLDivElement>(null)
	const GRID_SPACING = 30 // also defined in @\app\p\log\Dashboard\Dashboard.module.scss

	useLayoutEffect(() => {
		// load default width/height
		wrapperRef.current!.style.width = defaultWidth + 'px'
		wrapperRef.current!.style.height = defaultHeight + 'px'

		// load default position
		wrapperRef.current!.style.top = defaultPosTop + 'px'
		wrapperRef.current!.style.left = defaultPosLeft + 'px'
	})

	const onResizeGrabberMouseDown = (e: React.MouseEvent) => {
		if (resizable) {
			e.preventDefault()
			const startX = e.clientX
			const startY = e.clientY
			const startWidth = wrapperRef.current!.offsetWidth
			const startHeight = wrapperRef.current!.offsetHeight
			document.body.style.userSelect = 'none'
			document.body.style.cursor = 'se-resize'

			const handleMouseMove = (e: MouseEvent) => {
				const newWidth = roundToMultiple(
					Math.min(
						Math.max(startWidth + (e.clientX - startX), minWidth),
						maxWidth !== undefined ? maxWidth : Infinity
					),
					GRID_SPACING
				)
				const newHeight = roundToMultiple(
					Math.min(
						Math.max(startHeight + (e.clientY - startY), minHeight),
						maxHeight !== undefined ? maxHeight : Infinity
					),
					GRID_SPACING
				)

				wrapperRef.current!.style.width = `${newWidth}px`
				wrapperRef.current!.style.height = `${newHeight}px`
			}

			const handleMouseUp = () => {
				const width = parseInt(wrapperRef.current!.style.width)
				const height = parseInt(wrapperRef.current!.style.height)
				if (onResize) {
					onResize(width, height)
				}

				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
				document.body.style.userSelect = ''
				document.body.style.cursor = ''
			}

			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		}
	}

	const onRepositionGrabberMouseDown = (e: React.MouseEvent) => {
		const startX = e.clientX
		const startY = e.clientY
		const startTop = parseInt(wrapperRef.current!.style.top)
		const startLeft = parseInt(wrapperRef.current!.style.left)
		document.body.style.userSelect = 'none'
		document.body.style.cursor = 'move'

		const onMouseMove = (e: MouseEvent) => {
			const diffX = roundToMultiple(
				Math.max(e.clientX - startX + startLeft, 0),
				GRID_SPACING
			)
			const diffY = roundToMultiple(
				Math.max(e.clientY - startY + startTop, 0),
				GRID_SPACING
			)

			wrapperRef.current!.style.top = diffY + 'px'
			wrapperRef.current!.style.left = diffX + 'px'
		}
		const onMouseUp = () => {
			const top = parseInt(wrapperRef.current!.style.top)
			const left = parseInt(wrapperRef.current!.style.left)

			onReposition(top, left)

			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
			document.body.style.userSelect = ''
			document.body.style.cursor = ''
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
	}
	const roundToMultiple = (num: number, multiple: number) =>
		Math.round(num / multiple) * multiple

	return (
		<div
			className={s.wrapper}
			ref={wrapperRef}
			style={{
				minWidth: minWidth !== undefined ? `${minWidth}px` : undefined,
				minHeight: minHeight !== undefined ? `${minHeight}px` : undefined,
				maxWidth: maxWidth !== undefined ? `${maxWidth}px` : undefined,
				maxHeight: maxHeight !== undefined ? `${maxHeight}px` : undefined,
			}}
		>
			<div className={`${s.container} ${className ? className : ''}`} {...rest}>
				{children}
				{resizable && (
					<div className={s.resize_grabber} onMouseDown={onResizeGrabberMouseDown}>
						<ResizeHandle />
					</div>
				)}
				<div
					className={s.reposition_grabber}
					onMouseDown={onRepositionGrabberMouseDown}
				>
					<RepositionHandle />
				</div>
				{showEditButton && (
					<div className={s.edit_button} onMouseDown={onEditButtonClick}>
						<EditIcon />
					</div>
				)}
			</div>
		</div>
	)
}

export default Tile
