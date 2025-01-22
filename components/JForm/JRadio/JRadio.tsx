import { forwardRef } from 'react'
import s from './JRadio.module.scss'
interface JRadioProps extends React.HTMLProps<HTMLInputElement> {}

export const JRadio = forwardRef<HTMLInputElement, JRadioProps>(
	({ children, ...props }, ref) => {
		return (
			<label className={`${s.main} ${props.className ? props.className : ''}`}>
				<input type='radio' {...props} className={''} ref={ref} />
				<div className={s.custom_dot} />
				<span className={s.children}>{children}</span>
			</label>
		)
	}
)
JRadio.displayName = 'JRadio'
