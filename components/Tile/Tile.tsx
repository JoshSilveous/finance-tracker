import React, { useRef, useEffect, ReactNode, HTMLAttributes } from 'react'
import s from './Tile.module.scss'
import { default as ResizeHandle } from '@/public/resize_handle.svg'

interface ResizableWrapperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onResize'> {
	children: ReactNode
	resizable?: boolean
	onResize?: (width: number, height: number) => void
	minWidth?: number
	minHeight?: number
	maxWidth?: number
	maxHeight?: number
}

export function Tile({
	children,
	resizable,
	onResize,
	minWidth = 100,
	minHeight = 100,
	maxWidth,
	maxHeight,
	className,
	...rest
}: ResizableWrapperProps) {
	const wrapperRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (resizable) {
			const wrapper = wrapperRef.current
			if (!wrapper) return

			const observer = new ResizeObserver((entries) => {
				if (entries.length === 0) return
				const { width, height } = entries[0].contentRect

				if (onResize) {
					onResize(width, height)
				}
			})

			observer.observe(wrapper)

			return () => {
				observer.disconnect()
			}
		}
	}, [onResize, resizable])

	const onResizeGrabberMouseDown = resizable
		? (event: React.MouseEvent) => {
				event.preventDefault()
				const startX = event.clientX
				const startY = event.clientY
				const startWidth = wrapperRef.current?.offsetWidth || 0
				const startHeight = wrapperRef.current?.offsetHeight || 0

				const handleMouseMove = (moveEvent: MouseEvent) => {
					if (!wrapperRef.current) return

					const newWidth = Math.min(
						Math.max(startWidth + (moveEvent.clientX - startX), minWidth),
						maxWidth !== undefined ? maxWidth : Infinity
					)
					const newHeight = Math.min(
						Math.max(startHeight + (moveEvent.clientY - startY), minHeight),
						maxHeight !== undefined ? maxHeight : Infinity
					)

					wrapperRef.current.style.width = `${newWidth}px`
					wrapperRef.current.style.height = `${newHeight}px`

					if (onResize) {
						onResize(newWidth, newHeight)
					}
				}

				const handleMouseUp = () => {
					document.removeEventListener('mousemove', handleMouseMove)
					document.removeEventListener('mouseup', handleMouseUp)
				}

				document.addEventListener('mousemove', handleMouseMove)
				document.addEventListener('mouseup', handleMouseUp)
		  }
		: () => {}

	return (
		<div
			ref={wrapperRef}
			className={`${s.container} ${resizable ? s.resizable : ''} ${
				className ? className : ''
			}`}
			style={{
				minWidth: `${minWidth}px`,
				minHeight: `${minHeight}px`,
				maxWidth: `${maxWidth}px`,
				maxHeight: `${maxHeight}px`,
			}}
			{...rest}
		>
			{children}
			{resizable && (
				<div className={s.resize_grabber} onMouseDown={onResizeGrabberMouseDown}>
					<ResizeHandle />
				</div>
			)}
		</div>
	)
}

export default Tile
