import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from 'react'
import s from './JDatePicker.module.scss'
import { default as CalendarIcon } from '@/public/calendar.svg'

interface JDatePickerProps {
	/**
	 * In `YYYY-DD-MM` format
	 */
	defaultValue?: string
	className?: string
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}
export function JDatePicker(props: JDatePickerProps) {
	return (
		<div className={`${s.main} ${props.className ? props.className : ''}`}>
			<input type='date' defaultValue={props.defaultValue} onChange={props.onChange} />
			<div className={s.icon_container}>
				<CalendarIcon />
			</div>
		</div>
	)
}
