'use client'
import s from './tile.module.scss'

interface TileProps extends React.HTMLAttributes<HTMLDivElement> {
	resizable?: boolean
}
export function Tile(p: TileProps) {
	return (
		<div
			className={`${s.container} ${p.resizable ? s.resizable : ''} ${
				p.className ? p.className : ''
			}`}
		>
			{p.children}
		</div>
	)
}
