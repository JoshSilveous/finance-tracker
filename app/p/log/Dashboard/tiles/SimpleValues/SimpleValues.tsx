import { JGrid } from '@/components/JGrid'
import { Data } from '../../hooks'
import { SimpleValuesTile, TileDefaultSettings } from '../types'
import s from './SimpleValues.module.scss'
import { addCommas, createPopup, getNumPref, setNumPref } from '@/utils'
import { JGridTypes } from '@/components/JGrid/JGrid'
import { EditTilePopup } from './EditTilePopup'
export interface SimpleValuesProps {
	data: Data.Controller
	tileOptions: SimpleValuesTile['options']
	tileID: string
}

export const simpleValuesTileDefaults: TileDefaultSettings = {
	minWidth: 180,
	minHeight: 180,
	maxWidth: undefined,
	maxHeight: undefined,
	showEditButton: true,
	onEditButtonClick: (tile, setTileData, data) => {
		const popup = createPopup(
			<EditTilePopup
				tile={tile as SimpleValuesTile}
				setTileData={setTileData}
				data={data}
				closePopup={() => popup.close()}
			/>
		)
		popup.trigger()
	},
}

export function SimpleValues({ data, tileOptions, tileID }: SimpleValuesProps) {
	const cells: JGridTypes.Props['cells'] = (() => {
		if (tileOptions.show === 'categories') {
			const categories = [
				...data.cur.categories.filter(
					(cat) => !tileOptions.exclude.includes(cat.id)
				),
			]
			if (!tileOptions.exclude.includes('no_category')) {
				categories.push({
					id: '',
					name: { val: 'No Category', changed: false },
					amtBeforeCurrentTransactions: 0,
				})
			}
			return categories.map((cat, index) => {
				let totalChanged = false
				const catTotal = (() => {
					let total = cat.amtBeforeCurrentTransactions
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
				return [
					<div
						className={`${s.cell} ${s.name} ${
							cat.name.changed ? s.changed : ''
						}`}
						key={`${cat.id}-${index}-1`}
					>
						{cat.name.val}
					</div>,
					<div
						className={`${s.cell} ${s.amount} ${totalChanged ? s.changed : ''} ${
							catTotal < 0 ? s.negative : ''
						}`}
						key={`${cat.id}-${index}-2`}
					>
						{catTotal < 0 ? (
							<>
								<div className={s.symbol}>$</div>
								<div className={s.left_parenthesis}>(</div>
								<div className={s.number}>
									{addCommas(Math.abs(catTotal).toFixed(2))}
								</div>
								<div className={s.right_parenthesis}>)</div>
							</>
						) : (
							<>
								<div className={s.symbol}>$</div>
								<div className={s.number}>
									{addCommas(catTotal.toFixed(2))}
								</div>
							</>
						)}
					</div>,
				]
			})
		} else {
			const accounts: Data.StateAccount[] = [
				...data.cur.accounts.filter((act) => !tileOptions.exclude.includes(act.id)),
			]
			if (!tileOptions.exclude.includes('no_account')) {
				accounts.push({
					id: '',
					name: { val: 'No Account', changed: false },
					starting_amount: { val: '0', changed: false },
					amtBeforeCurrentTransactions: 0,
				})
			}
			return accounts.map((act, index) => {
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

				return [
					<div
						className={`${s.cell} ${s.name} ${
							act.name.changed ? s.changed : ''
						}`}
						key={`${act.id}-${index}-1`}
					>
						{act.name.val}
					</div>,
					<div
						className={`${s.cell} ${s.amount} ${totalChanged ? s.changed : ''} ${
							actTotal < 0 ? s.negative : ''
						}`}
						key={`${act.id}-${index}-2`}
					>
						{actTotal < 0 ? (
							<>
								<div className={s.symbol}>$</div>
								<div className={s.left_parenthesis}>(</div>
								<div className={s.number}>
									{addCommas(Math.abs(actTotal).toFixed(2))}
								</div>
								<div className={s.right_parenthesis}>)</div>
							</>
						) : (
							<>
								<div className={s.symbol}>$</div>
								<div className={s.number}>
									{addCommas(actTotal.toFixed(2))}
								</div>
							</>
						)}
					</div>,
				]
			})
		}
	})()

	const headers: JGridTypes.Props['headers'] = [
		{
			defaultWidth: getNumPref(`SimpleValues-${tileID}-Name`, 50),
			minWidth: 40,
			content: <div className={s.header}>Name</div>,
		},
		{
			defaultWidth: getNumPref(`SimpleValues-${tileID}-Amount`, 50),
			minWidth: 40,
			content: <div className={s.header}>Amount</div>,
		},
	]
	const gridConfig: JGridTypes.Props = {
		className: s.grid,
		headers: headers,
		cells: cells,
		useFullWidth: true,
		noBorders: true,
		onResize: (e) => {
			switch (e.columnIndex) {
				case 0: {
					setNumPref(`SimpleValues-${tileID}-Name`, e.newWidth)
					break
				}
				case 1: {
					setNumPref(`SimpleValues-${tileID}-Amount`, e.newWidth)
					break
				}
			}
		},
	}

	return (
		<div className={s.main}>
			{tileOptions.showTitle && <div className={s.title}>{tileOptions.title}</div>}
			<JGrid {...gridConfig} />
		</div>
	)
}
