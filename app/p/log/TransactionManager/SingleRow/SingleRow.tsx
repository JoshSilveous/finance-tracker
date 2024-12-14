import { JInput, JNumberAccounting } from '@/components/JForm'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JDropdown, JDropdownTypes } from '@/components/JForm/JDropdown/JDropdown'
import { FetchedTransaction } from '@/database'
import { default as ReorderIcon } from '@/public/reorder.svg'
import s from './SingleRow.module.scss'
import {
	ChangeEvent,
	ChangeEventHandler,
	Dispatch,
	forwardRef,
	SetStateAction,
	useEffect,
} from 'react'

type Key = 'amount' | 'category_id' | 'account_id' | 'date' | 'name'
export interface SingleRowProps {
	curTransaction: FetchedTransaction
	defTransaction: FetchedTransaction
	placeMarginAbove: boolean
	dropdownOptionsCategory: JDropdownTypes.Option[]
	dropdownOptionsAccount: JDropdownTypes.Option[]
	onResortMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
	setCurTransactionData: Dispatch<SetStateAction<FetchedTransaction[] | null>>
}
export const SingleRow = forwardRef<HTMLDivElement, SingleRowProps>(
	(props, forwardedRef) => {
		const curItem = props.curTransaction.items[0]
		const defItem = props.defTransaction.items[0]

		// add/remove change class whenever anything is changed

		// should only apply changed style
		const onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
			const origVal = e.target.dataset.default
			const key = e.target.dataset.key as Key
			const newVal = e.target.value

			console.log(`Change!\nkey: ${key}\norig: ${origVal}\nnew: ${newVal}`)

			// avoid state update if user is adding a decimal to the end of the `amount` input
			if (key === 'amount' && newVal.at(-1) === '.') {
				e.target.value = newVal
				console.log('hit!')
				return
			}
			// sighh i'm gonna need to make amount be strings instead of numbers. gonna need to change state entirely.
			// OR we can make a change system similar to accounts

			props.setCurTransactionData((prev) => {
				console.log('state update')
				const clone = structuredClone(prev)

				if (key === 'name' || key === 'date') {
					clone!.find(
						(transaction) => transaction.id === props.curTransaction.id
					)![key as 'name' | 'date'] = newVal
				} else if (key === 'amount') {
					clone!.find(
						(transaction) => transaction.id === props.curTransaction.id
					)!.items[0][key as 'amount'] = parseInt(newVal)
				} else {
					clone!.find(
						(transaction) => transaction.id === props.curTransaction.id
					)!.items[0][key as 'category_id' | 'account_id'] = newVal
				}

				return clone
			})
		}

		return (
			<div
				className={s.container}
				ref={forwardedRef}
				data-transaction_id={props.curTransaction.id}
			>
				<div
					className={`${s.cell_container} ${s.row_controller} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<div
						className={s.reorder_grabber}
						onMouseDown={props.onResortMouseDown}
						title='Grab and drag to reposition this item'
					>
						<ReorderIcon />
					</div>
				</div>
				<div
					className={`${s.cell_container} ${s.first_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JDatePicker
						value={props.curTransaction.date}
						data-key={'date'}
						data-default={props.defTransaction.date}
						onChange={onChange}
					/>
				</div>
				<div
					className={`${s.cell_container} ${s.mid_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JInput
						value={props.curTransaction.name}
						data-key={'name'}
						data-default={props.defTransaction.name}
						onChange={onChange}
					/>
				</div>
				<div
					className={`${s.cell_container} ${s.mid_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JNumberAccounting
						value={curItem.amount}
						data-key={'amount'}
						data-default={defItem.amount}
						onChange={onChange}
					/>
				</div>
				<div
					className={`${s.cell_container} ${s.mid_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JDropdown
						options={props.dropdownOptionsCategory}
						value={
							curItem.category_id !== null ? curItem.category_id : undefined
						}
						data-key={'category_id'}
						data-default={
							defItem.category_id !== null ? defItem.category_id : undefined
						}
						onChange={onChange}
					/>
				</div>
				<div
					className={`${s.cell_container} ${s.last_col} ${
						props.placeMarginAbove ? s.margin_above : ''
					}`}
					data-transaction_id={props.curTransaction.id}
				>
					<JDropdown
						options={props.dropdownOptionsAccount}
						value={curItem.account_id !== null ? curItem.account_id : undefined}
						data-key={'account_id'}
						data-default={
							defItem.account_id !== null ? defItem.account_id : undefined
						}
						onChange={onChange}
					/>
				</div>
			</div>
		)
	}
)
