import s from './DateRow.module.scss'
import { formatDate } from '@/utils/formatDate'
import { JButton } from '@/components/JForm'
import { createPopup, parseDateString } from '@/utils'
import { NewTransactionForm } from './NewTransactionForm/NewTransactionForm'
import { DropdownOptions } from '../../TransactionManager'
import { TabIndexer } from '../../hooks'
import { getCurDateString } from '@/utils'
import { SavePrompt } from './SavePrompt/SavePrompt'

interface DateRowProps {
	date: string
	dropdownOptions: DropdownOptions
	refreshData: () => void
	gridRow: number
	tabIndexer: TabIndexer
	gridNavIndex: number
	changesArePending: boolean
	handleSave: () => Promise<void>
}
export function DateRow({
	date,
	dropdownOptions,
	refreshData,
	gridRow,
	tabIndexer,
	gridNavIndex,
	changesArePending,
	handleSave,
}: DateRowProps) {
	const { day, year, month } = formatDate(date)

	const handleNewTransactionClickWhilePendingSaves = () => {
		// this is temporary, will be removed once inline transaction adding is ready
		const popup = createPopup(
			<SavePrompt
				closePopup={() => popup.close()}
				afterSave={() => handleNewTransactionClick()}
				handleSave={handleSave}
			/>
		)
		popup.trigger()
	}

	const handleNewTransactionClick = () => {
		let refreshRequired = false

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
				setRefreshRequired={() => (refreshRequired = true)}
			/>,
			'normal',
			afterPopupClosed
		)
		popup.trigger()
	}

	const isToday = date === getCurDateString()
	const isYesterday = date === getCurDateString(-1)

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
						onClick={
							changesArePending
								? handleNewTransactionClickWhilePendingSaves
								: handleNewTransactionClick
						}
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
