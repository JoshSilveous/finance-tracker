import { ButtonHTMLAttributes } from 'react'
import style from './JButton.module.scss'
import { default as LoadingIcon } from '@/public/loading.svg'

interface Props {
	accent?: 'primary' | 'secondary'
	isLoading?: boolean
	text: string
	icon?: any
}

export function JButton({
	accent,
	isLoading,
	text,
	icon,
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Props) {
	return (
		<button
			className={`${style.main} ${accent === 'primary' ? style.primary : ''} ${
				className ? className : ''
			} ${isLoading ? style.loading : ''}`}
			{...props}
			disabled={isLoading}
		>
			<div className={style.icon_container}>{icon}</div>
			<div className={style.text}>{text}</div>
			<div className={style.loading_container}>
				<LoadingIcon alt='loading icon' className={style.icon} />
			</div>
		</button>
	)
}
