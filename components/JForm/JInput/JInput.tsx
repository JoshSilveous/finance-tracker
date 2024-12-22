import { forwardRef, InputHTMLAttributes } from 'react'
import s from './JInput.module.scss'

interface JInputProps extends InputHTMLAttributes<HTMLInputElement> {
	minimalStyle?: boolean
}

export const JInput = forwardRef<HTMLInputElement, JInputProps>((props, ref) => {
	return (
		<div
			className={`${s.main} ${props.className ? props.className : ''} ${
				props.minimalStyle ? s.minimal_style : ''
			} ${props.disabled ? s.disabled : ''}`}
		>
			<input {...props} ref={ref} />
		</div>
	)
})
JInput.displayName = 'JInput'
