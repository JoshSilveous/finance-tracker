import { Data } from '../../hooks'
import s from './SimpleValues.module.scss'
import { addCommas } from '@/utils'
export interface SimpleValuesProps {
	data: Data.Controller
	show: 'accounts' | 'categories'
	exclude: string[]
	title: string
	showTitle: boolean
}

export function SimpleValues({ data, show, exclude, title, showTitle }: SimpleValuesProps) {
	const tableRows = (() => {
		if (show === 'categories') {
			const categories = [
				...data.cur.categories,
				{ id: '', name: { val: 'No Category', changed: false } },
			]
			return categories.map((cat) => {
				let totalChanged = false
				const catTotal = (() => {
					let total = 0
					data.cur.transactions.forEach((transaction) => {
						transaction.items.forEach((item) => {
							if (item.category_id.val === cat.id) {
								total += Number(item.amount.val)
								if (
									(!totalChanged && item.amount.changed) ||
									item.category_id.changed
								) {
									totalChanged = true
								}
							}
						})
					})
					return total
				})()

				return (
					<tr>
						<td className={`${s.name} ${cat.name.changed ? s.changed : ''}`}>
							{cat.name.val}
						</td>
						<td className={`${s.amount} ${totalChanged ? s.changed : ''}`}>
							${addCommas(catTotal.toFixed(2))}
						</td>
					</tr>
				)
			})
		} else if (show === 'accounts') {
			const accounts: Data.StateAccount[] = [
				...data.cur.accounts,
				{
					id: '',
					name: { val: 'No Account', changed: false },
					starting_amount: { val: '0', changed: false },
					amtBeforeCurrentTransactions: 0,
				},
			]
			return accounts.map((act) => {
				let totalChanged = false
				const actTotal = (() => {
					let total = Number(act.starting_amount.val)
					data.cur.transactions.forEach((transaction) => {
						transaction.items.forEach((item) => {
							if (item.account_id.val === act.id) {
								total += Number(item.amount.val)
								if (
									(!totalChanged && item.amount.changed) ||
									item.account_id.changed
								) {
									totalChanged = true
								}
							}
						})
					})
					return total
				})()

				return (
					<tr>
						<td className={`${s.name} ${act.name.changed ? s.changed : ''}`}>
							{act.name.val}
						</td>
						<td className={`${s.amount} ${totalChanged ? s.changed : ''}`}>
							${addCommas(actTotal.toFixed(2))}
						</td>
					</tr>
				)
			})
		}
	})()
	return (
		<div className={s.main}>
			{showTitle && <div className={s.title}>{title}</div>}
			<table className={s.table}>
				<tbody>{tableRows}</tbody>
			</table>
		</div>
	)
}
