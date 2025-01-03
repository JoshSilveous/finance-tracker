import s from './DateRow.module.scss'
import { formatDate } from '@/utils/formatDate'
import { JButton } from '@/components/JForm'
import { createPopup } from '@/utils'
import { NewTransactionForm } from './NewTransactionForm/NewTransactionForm'
import { DropdownOptions } from '../../TransactionManager'
import { TabIndexer } from '../../hooks'
import { getDateString } from '@/utils/getDateString'

interface DateRowProps {
	date: string
	dropdownOptions: DropdownOptions
	refreshData: () => void
	gridRow: number
	tabIndexer: TabIndexer
	gridNavIndex: number
}
export function DateRow({
	date,
	dropdownOptions,
	refreshData,
	gridRow,
	tabIndexer,
	gridNavIndex,
}: DateRowProps) {
	const { day, year, month } = formatDate(date)

	const handleNewTransactionClick = () => {
		let refreshRequired = false
		const setRefreshRequired = () => {
			refreshRequired = true
		}

		const afterPopupClosed = () => {
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

	const isToday = date === getDateString()
	const isYesterday = date === getDateString(-1)

	const dateDisplay = (
		<div className={s.date_container}>
			{day.long}, {month.short}
			&nbsp;<span className={s.day_num}>{day.num}</span>
			<span className={s.suffix}>{day.suffix}</span>&nbsp;{year}
			{isToday && ' (Today)'}
			{isYesterday && ' (Yesterday)'}
		</div>
	)

	return (
		<div className={s.main}>
			<div className={s.empty} style={{ gridRow: `${gridRow} / ${gridRow + 1}` }} />
			<div className={s.content} style={{ gridRow: `${gridRow} / ${gridRow + 1}` }}>
				{dateDisplay}
				<div className={s.new_transaction_container}>
					<JButton
						jstyle='secondary'
						onClick={handleNewTransactionClick}
						tabIndex={tabIndexer()}
						data-grid_nav_col='TM_account'
						data-grid_nav_index={gridNavIndex}
					>
						Create New Transaction
					</JButton>
				</div>
			</div>
		</div>
	)
}
