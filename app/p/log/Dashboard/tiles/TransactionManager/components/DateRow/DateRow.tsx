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
			<div style={{ maxWidth: '300px' }}>
				<p>
					You'll have to save your changes before creating a new transaction (this
					is temporary, this will soon be updated to support inline transaction
					creation).
				</p>
				<p>Would you like to save your changes?</p>
				<div style={{ display: 'flex', gap: '10px' }}>
					<JButton
						jstyle='secondary'
						onClick={() => {
							popup.close()
						}}
					>
						Go Back
					</JButton>
					<JButton
						jstyle='primary'
						onClick={async () => {
							await handleSave()
							popup.close()
							handleNewTransactionClick()
						}}
					>
						Save
					</JButton>
				</div>
			</div>
		)
		popup.trigger()
	}

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
