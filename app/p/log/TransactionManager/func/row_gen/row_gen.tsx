import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedAccount, FetchedCategory, FetchedTransaction } from '@/database'
import { MouseEvent } from 'react'
import s from './row_gen.module.scss'

export function genSingleRow(
	transaction: FetchedTransaction,
	dropdownOptionsCategory: JDropdownTypes.Option[],
	dropdownOptionsAccount: JDropdownTypes.Option[]
) {
	const transactionItem = transaction.items[0]
	return [
		<div className={s.row_controller}></div>,
		<div className={`${s.data_container} ${s.single_item} ${s.first_col}`}>
			<JDatePicker defaultValue={transaction.date} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JInput defaultValue={transaction.name} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JNumberAccounting defaultValue={transactionItem.amount} />
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.mid_col}`}>
			<JDropdown
				options={dropdownOptionsCategory}
				defaultValue={
					transactionItem.category_id !== null
						? transactionItem.category_id
						: undefined
				}
			/>
		</div>,
		<div className={`${s.data_container} ${s.single_item} ${s.last_col}`}>
			<JDropdown
				options={dropdownOptionsAccount}
				defaultValue={
					transactionItem.account_id !== null
						? transactionItem.account_id
						: undefined
				}
			/>
		</div>,
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

		function handleReorder(e: MouseEvent<HTMLDivElement>) {
			const reorderElem = e.target as HTMLDivElement
			const rowElem = reorderElem.parentElement!.parentElement!
				.parentElement as HTMLDivElement
			console.log(rowElem)
		}

		return [
			<div className={s.row_controller}>
				<div onClick={handleReorder}>O</div>
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.first_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JDatePicker defaultValue={transaction.date} disabled minimalStyle />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JInput defaultValue={item.name} />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JNumberAccounting defaultValue={item.amount} />
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JDropdown
					options={dropdownOptionsCategory}
					defaultValue={item.category_id !== null ? item.category_id : undefined}
				/>
			</div>,
			<div
				className={`${s.data_container} ${s.multi_item} ${s.last_col} ${
					isLastRow ? s.last_row : s.mid_row
				}`}
			>
				<JDropdown
					options={dropdownOptionsAccount}
					defaultValue={item.account_id !== null ? item.account_id : undefined}
				/>
			</div>,
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
		<div className={s.row_controller}></div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.first_row} ${s.first_col}`}>
			<JDatePicker defaultValue={transaction.date} />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}>
			<JInput defaultValue={transaction.name} />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}>
			<JNumberAccounting defaultValue={sum} disabled minimalStyle />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.mid_col} ${s.first_row}`}>
			<JInput defaultValue={categoryList} disabled minimalStyle />
		</div>,
		<div className={`${s.data_container} ${s.multi_item} ${s.last_col} ${s.first_row}`}>
			<JInput defaultValue={accountList} disabled minimalStyle />
		</div>,
	]
	return [firstRow, ...nextRows]
}
