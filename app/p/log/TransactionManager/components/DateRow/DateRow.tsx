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
	refreshData: () => void
	gridRow: number
}
export function DateRow({ date, dropdownOptions, refreshData, gridRow }: DateRowProps) {
	const { day, year, month } = formatDate(date)

	const handleNewTransactionClick = () => {
		let refreshRequired = false
		const setRefreshRequired = () => {
			refreshRequired = true
		}

		const afterPopupClosed = () => {
			console.log('popup closed, refreshRequired: ', refreshRequired)
			if (refreshRequired) {
				refreshData()
			}
		}

		const popup = createPopup(
			<NewTransactionForm
				defaultDate={date}
				dropdownOptions={dropdownOptions}
				forceClosePopup={() => {
					popup.close()
					afterPopupClosed()
				}}
				setRefreshRequired={setRefreshRequired}
			/>,
			'normal',
			afterPopupClosed
		)
		popup.trigger()
	}

	return (
		<div className={s.main}>
			<div className={s.empty} style={{ gridRow: `${gridRow} / ${gridRow + 1}` }} />
			<div className={s.content} style={{ gridRow: `${gridRow} / ${gridRow + 1}` }}>
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
		</div>
	)
}
