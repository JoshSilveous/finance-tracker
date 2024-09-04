import { ButtonHTMLAttributes } from 'react'
import s from './JButton.module.scss'

interface JButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	jstyle: 'primary' | 'secondary'
	loading?: boolean
}

export function JButton(props: JButtonProps) {
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
		<button {...props} className={`${props.className} ${s.jbutton} ${jstyleClass}`}>
			{props.loading ? '...' : props.children}
		</button>
	)
}
