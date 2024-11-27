import { InputHTMLAttributes } from 'react'
import s from './JInput.module.scss'

interface JInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function JInput(props: JInputProps) {
	return (
		<div className={`${s.main} ${props.className ? props.className : ''}`}>
			<input {...props} />
		</div>
	)
}
