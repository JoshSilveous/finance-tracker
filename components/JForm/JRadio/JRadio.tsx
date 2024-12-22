import { forwardRef, ReactNode } from 'react'
import s from './JRadio.module.scss'
interface JRadioProps extends React.HTMLProps<HTMLInputElement> {}

export const JRadio = forwardRef<HTMLInputElement, JRadioProps>((props, ref) => {
	return (
		<label className={`${s.main} ${props.className ? props.className : ''}`}>
			<input type='radio' {...props} className={''} children={undefined} ref={ref} />
			<div className={s.custom_dot} />
			<span className={s.children}>{props.children}</span>
		</label>
	)
})
