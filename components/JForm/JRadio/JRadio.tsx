import { ReactNode } from 'react'
import s from './JRadio.module.scss'
interface JRadioProps extends React.HTMLProps<HTMLInputElement> {}

export function JRadio(props: JRadioProps) {
	return (
		<label className={`${s.main} ${props.className ? props.className : ''}`}>
			<input type='radio' {...props} className={''} children={undefined} />
			<div className={s.custom_dot} />
			<span className={s.children}>{props.children}</span>
		</label>
	)
}
