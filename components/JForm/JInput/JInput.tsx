import { forwardRef, InputHTMLAttributes } from 'react'
import s from './JInput.module.scss'

interface JInputProps extends InputHTMLAttributes<HTMLInputElement> {
	minimalStyle?: boolean
}

export const JInput = forwardRef<HTMLInputElement, JInputProps>(
	({ className, minimalStyle, disabled, ...rest }, ref) => {
		return (
			<div
				className={`${s.main} ${className ? className : ''} ${
					minimalStyle ? s.minimal_style : ''
				} ${disabled ? s.disabled : ''}`}
			>
				<input disabled={disabled} {...rest} ref={ref} />
			</div>
		)
	}
)
JInput.displayName = 'JInput'
