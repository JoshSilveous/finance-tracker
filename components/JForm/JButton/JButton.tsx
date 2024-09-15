import { ButtonHTMLAttributes } from 'react'
import s from './JButton.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'

interface JButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	jstyle: 'primary' | 'secondary'
	loading?: boolean
}

export function JButton({ jstyle, loading, ...props }: JButtonProps) {
	let jstyleClass = ''
	switch (jstyle) {
		case 'primary':
			jstyleClass = s.primary
			break
		case 'secondary':
			jstyleClass = s.secondary
			break
	}

	return (
		<button
			{...props}
			className={`${props.className} ${s.jbutton} ${jstyleClass} ${
				loading ? s.loading : ''
			}`}
		>
			{loading ? <LoadingAnim /> : props.children}
		</button>
	)
}
