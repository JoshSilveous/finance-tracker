import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from 'react'
import s from './JDatePicker.module.scss'
import { default as CalendarIcon } from '@/public/calendar.svg'

interface JDatePickerProps {
	/**
	 * In `YYYY-DD-MM` format
	 */
	value?: string
	className?: string
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void
	minimalStyle?: boolean
	disabled?: boolean
}
export function JDatePicker(props: JDatePickerProps) {
	return (
		<div
			className={`${s.main} ${props.className ? props.className : ''} ${
				props.minimalStyle ? s.minimal_style : ''
			} ${props.disabled ? s.disabled : ''}`}
		>
			<input
				type='date'
				value={props.value}
				onChange={props.onChange}
				disabled={props.disabled}
			/>
			<div className={s.icon_container}>
				<CalendarIcon />
			</div>
		</div>
	)
}
