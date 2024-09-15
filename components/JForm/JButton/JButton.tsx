import { ButtonHTMLAttributes } from 'react'
import s from './JButton.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'

interface JButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	jstyle: 'primary' | 'secondary'
	loading?: boolean
}

export function JButton(props: JButtonProps) {
	console.log('JButton Props:', props.loading, typeof props.loading)
	let jstyleClass = ''
	switch (props.jstyle) {
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
				props.loading ? s.loading : ''
			}`}
		>
			{props.loading ? <LoadingAnim /> : props.children}
		</button>
	)
}
