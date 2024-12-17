import { useCallback } from 'react'
import s from './DateRow.module.scss'
import { formatDate } from '@/utils/formatDate'

interface DateRowProps {
	date: string
}
export function DateRow({ date }: DateRowProps) {
	const { day, year, month } = formatDate(date)
	return (
		<div className={s.container}>
			<div className={s.weekday}>{day.long}</div>
			<div className={s.month}>{month.short}</div>
			<div className={s.day}>{day.num}</div>
			<div className={s.suffix}>{day.suffix}</div>
			<div className={s.year}>{year}</div>
		</div>
	)
}
