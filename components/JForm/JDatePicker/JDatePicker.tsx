import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from 'react'
import s from './JDatePicker.module.scss'
import { default as CalendarIcon } from '@/public/calendar.svg'

interface JDatePickerProps
	extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
	/**
	 * In `YYYY-DD-MM` format
	 */
	value?: string
	className?: string
	minimalStyle?: boolean
}
export function JDatePicker({ className, minimalStyle, ...rest }: JDatePickerProps) {
	return (
		<div
			className={`${s.main} ${className ? className : ''} ${
				minimalStyle ? s.minimal_style : ''
			} ${rest.disabled ? s.disabled : ''}`}
		>
			<input type='date' {...rest} />
			<div className={s.icon_container}>
				<CalendarIcon />
			</div>
		</div>
	)
}
