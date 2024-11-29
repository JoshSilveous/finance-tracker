import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedAccount, FetchedCategory, FetchedTransaction } from '@/database'
import s from './row_gen.module.scss'

export function genSingleRow(
	transaction: FetchedTransaction,
	dropdownOptionsCategory: JDropdownTypes.Option[],
	dropdownOptionsAccount: JDropdownTypes.Option[]
) {
	const transactionItem = transaction.items[0]
	return [
		{ content: <div className={s.row_controller}></div> },
		{
			content: (
				<div className={`${s.data_container} ${s.single_item} ${s.first_col}`}>
					<JDatePicker defaultValue={transaction.date} />
				</div>
			),
		},
		{
			content: (
				<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
					<JInput value={transaction.name} />
				</div>
			),
		},
		{
			content: (
				<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
					<JNumberAccounting value={transactionItem.amount} />
				</div>
			),
		},
		{
			content: (
				<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
					<JDropdown
						options={dropdownOptionsCategory}
						defaultValue={
							transactionItem.category_id !== null
								? transactionItem.category_id
								: undefined
						}
					/>
				</div>
			),
		},
		{
			content: (
				<div className={`${s.data_container} ${s.single_item} ${s.last_col}`}>
					<JDropdown
						options={dropdownOptionsAccount}
						defaultValue={
							transactionItem.account_id !== null
								? transactionItem.account_id
								: undefined
						}
					/>
				</div>
			),
		},
	]
}

export function genMultiRow(
	transaction: FetchedTransaction,
	categories: FetchedCategory[],
	accounts: FetchedAccount[],
	dropdownOptionsCategory: JDropdownTypes.Option[],
	dropdownOptionsAccount: JDropdownTypes.Option[]
) {
	let sum = 0
	const nextRows = transaction.items.map((item, itemIndex) => {
		sum += item.amount

		const isLastRow = itemIndex === transaction.items.length - 1

		return [
			{ content: <div className={s.row_controller}></div> },
			{
				content: (
					<div
						className={`${s.data_container} ${s.multi_item} ${s.first_col} ${
							isLastRow ? s.last_row : s.mid_row
						}`}
					>
						<JDatePicker defaultValue={transaction.date} disabled minimalStyle />
					</div>
				),
			},
			{
				content: (
					<div
						className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
							isLastRow ? s.last_row : s.mid_row
						}`}
					>
						<JInput value={item.name} />
					</div>
				),
			},
			{
				content: (
					<div
						className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
							isLastRow ? s.last_row : s.mid_row
						}`}
					>
						<JNumberAccounting value={item.amount} />
					</div>
				),
			},
			{
				content: (
					<div
						className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
							isLastRow ? s.last_row : s.mid_row
						}`}
					>
						<JDropdown
							options={dropdownOptionsCategory}
							defaultValue={
								item.category_id !== null ? item.category_id : undefined
							}
						/>
					</div>
				),
			},
			{
				content: (
					<div
						className={`${s.data_container} ${s.multi_item} ${s.last_col} ${
							isLastRow ? s.last_row : s.mid_row
						}`}
					>
						<JDropdown
							options={dropdownOptionsAccount}
							defaultValue={
								item.account_id !== null ? item.account_id : undefined
							}
						/>
					</div>
				),
			},
		]
	})

	let categoryList = ''
	let accountList = ''
	transaction.items.forEach((item) => {
		if (item.category_id !== null) {
			const categoryName = categories.find((cat) => cat.id === item.category_id)!.name
			if (categoryList === '') {
				categoryList += categoryName
			} else {
				categoryList += ', ' + categoryName
			}
		}
		if (item.account_id !== null) {
			const accountName = accounts.find((act) => act.id === item.account_id)!.name
			if (accountList === '') {
				accountList += accountName
			} else {
				accountList += ', ' + accountName
			}
		}
	})

	const firstRow = [
		{ content: <div className={s.row_controller}></div> },
		{
			content: (
				<div
					className={`${s.data_container} ${s.multi_item} ${s.first_row} ${s.first_col}`}
				>
					<JDatePicker defaultValue={transaction.date} />
				</div>
			),
		},
		{
			content: (
				<div
					className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}
				>
					<JInput value={transaction.name} />
				</div>
			),
		},
		{
			content: (
				<div
					className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}
				>
					<JNumberAccounting value={sum} disabled minimalStyle />
				</div>
			),
		},
		{
			content: (
				<div
					className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}
				>
					<JInput value={categoryList} disabled minimalStyle />
				</div>
			),
		},
		{
			content: (
				<div
					className={`${s.data_container} ${s.multi_item} ${s.last_col} ${s.first_row}`}
				>
					<JInput value={accountList} disabled minimalStyle />
				</div>
			),
		},
	]
	return [firstRow, ...nextRows]
}
