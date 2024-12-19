import { useCallback } from 'react'
import s from './DateRow.module.scss'
import { formatDate } from '@/utils/formatDate'
import { JButton } from '@/components/JForm'
import { createPopup } from '@/utils'
import { NewTransactionForm } from './NewTransactionForm/NewTransactionForm'
import { DropdownOptions } from '../../TransactionManager'

interface DateRowProps {
	date: string
	dropdownOptions: DropdownOptions
}
export function DateRow({ date, dropdownOptions }: DateRowProps) {
	const { day, year, month } = formatDate(date)

	const handleNewTransactionClick = () => {
		const popup = createPopup(
			<NewTransactionForm defaultDate={date} dropdownOptions={dropdownOptions} />
		)
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
