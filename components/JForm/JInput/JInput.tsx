import { InputHTMLAttributes } from 'react'
import s from './JInput.module.scss'

interface JInputProps extends InputHTMLAttributes<HTMLInputElement> {
	minimalStyle?: boolean
}

export function JInput(props: JInputProps) {
	const inputProps = structuredClone(props)
	delete inputProps.minimalStyle
	return (
		<div
			className={`${s.main} ${props.className ? props.className : ''} ${
				props.minimalStyle ? s.minimal_style : ''
			} ${props.disabled ? s.disabled : ''}`}
		>
			<input {...inputProps} />
		</div>
	)
}
