import { ReactNode } from 'react'
import style from './Card.module.scss'

interface Props {
	title: string
	description?: string
	children: ReactNode
}

export default function Card({ title, description, children }: Props) {
	return (
		<div className={style.container}>
			<div className={style.main}>
				<h3>{title}</h3>
				<p>{description}</p>
				{children}
			</div>
		</div>
	)
}
