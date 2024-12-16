'use client'
import s from './tile.module.scss'

interface TileProps extends React.HTMLAttributes<HTMLDivElement> {
	resizable?: boolean
}
export function Tile({ className, resizable, ...rest }: TileProps) {
	return (
		<div
			className={`${s.container} ${resizable ? s.resizable : ''} ${
				className ? className : ''
			}`}
			{...rest}
		/>
	)
}
