import { ButtonHTMLAttributes } from 'react'
import s from './JButton.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'

interface JButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	jstyle: 'primary' | 'secondary' | 'invisible'
	loading?: boolean
}

export function JButton({ jstyle, loading, ...props }: JButtonProps) {
	return (
		<button
			{...props}
			className={`${props.className} ${s.jbutton} ${s[jstyle]} ${
				loading ? s.loading : ''
			}`}
		>
			{loading ? <LoadingAnim /> : props.children}
		</button>
	)
}
