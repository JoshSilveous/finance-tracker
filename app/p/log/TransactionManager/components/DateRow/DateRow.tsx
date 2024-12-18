import { useCallback } from 'react'
import s from './DateRow.module.scss'
import { formatDate } from '@/utils/formatDate'
import { JButton } from '@/components/JForm'
import { createPopup } from '@/utils'
import { NewTransactionForm } from './NewTransactionForm/NewTransactionForm'

interface DateRowProps {
	date: string
}
export function DateRow({ date }: DateRowProps) {
	const { day, year, month } = formatDate(date)

	const handleNewTransactionClick = () => {
		const popup = createPopup(<NewTransactionForm defaultDate={date} />)
		popup.trigger()
	}

	return (
		<div className={s.main}>
			<div className={s.date_container}>
				<div className={s.weekday}>{day.long}</div>
				<div className={s.month}>{month.short}</div>
				<div className={s.day}>{day.num}</div>
				<div className={s.suffix}>{day.suffix}</div>
				<div className={s.year}>{year}</div>
			</div>
			<div className={s.new_transaction_container}>
				<JButton jstyle='secondary' onClick={handleNewTransactionClick}>
					Create New Transaction
				</JButton>
			</div>
		</div>
	)
}
