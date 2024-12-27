import { ChangeEventHandler, FocusEventHandler } from 'react'
import { LiveVals } from './genLiveVals'
import { MultiRowProps } from '../MultiRow'

export function genEventHandlers(p: MultiRowProps) {
	return {
		onChange: ((e) => {
			const key = e.target.dataset.key as
				| keyof LiveVals
				| keyof LiveVals['items'][number]
			const item_id = e.target.dataset.item_id
			const newVal = e.target.value

			p.historyController.clearRedo()

			// update pendingChanges
			if (item_id === undefined) {
				if (key === 'date' || key === 'name') {
					const origVal = p.transaction[key]
					if (origVal !== newVal) {
						p.pendingChanges.updateChange(
							'transactions',
							p.transaction.id,
							key,
							newVal
						)
					} else {
						p.pendingChanges.updateChange('transactions', p.transaction.id, key)
					}
				} else {
				}
			} else {
				if (
					key === 'name' ||
					key === 'amount' ||
					key === 'category_id' ||
					key === 'account_id'
				) {
					const origVal = p.transaction.items.find((item) => item.id === item_id)![
						key
					]
					if (origVal !== newVal) {
						p.pendingChanges.updateChange('items', item_id, key, newVal)
					} else {
						p.pendingChanges.updateChange('items', item_id, key)
					}
				} else {
				}
			}

			// update history
			const oldVal = e.target.dataset.value_on_focus
			if (oldVal !== undefined && newVal !== oldVal) {
				if (key === 'date') {
					p.historyController.upsert({
						type: 'transaction_value_change',
						transaction_id: p.transaction.id,
						key,
						oldVal,
						newVal,
					})
				} else if (key === 'name' && item_id === undefined) {
					p.historyController.upsert({
						type: 'transaction_value_change',
						transaction_id: p.transaction.id,
						key,
						oldVal,
						newVal,
					})
				} else if (
					(key === 'name' ||
						key === 'amount' ||
						key === 'category_id' ||
						key === 'account_id') &&
					item_id !== undefined
				) {
					p.historyController.upsert({
						type: 'item_value_change',
						transaction_id: p.transaction.id,
						item_id: item_id,
						key,
						oldVal,
						newVal,
					})
				}
			}
		}) as ChangeEventHandler<HTMLInputElement | HTMLSelectElement>,
		onBlur: ((e) => {
			const key = e.target.dataset.key as
				| keyof LiveVals
				| keyof LiveVals['items'][number]
			const item_id = e.target.dataset.item_id
			const newVal = e.target.value
			const oldVal = e.target.dataset.value_on_focus
			if (oldVal !== undefined && newVal !== oldVal) {
				if (key === 'date') {
					p.historyController.upsert({
						type: 'transaction_value_change',
						transaction_id: p.transaction.id,
						key,
						oldVal,
						newVal,
					})
				} else if (key === 'name' && item_id === undefined) {
					p.historyController.upsert({
						type: 'transaction_value_change',
						transaction_id: p.transaction.id,
						key,
						oldVal,
						newVal,
					})
				} else if (
					(key === 'name' ||
						key === 'amount' ||
						key === 'category_id' ||
						key === 'account_id') &&
					item_id !== undefined
				) {
					p.historyController.upsert({
						type: 'item_value_change',
						transaction_id: p.transaction.id,
						item_id: item_id,
						key,
						oldVal,
						newVal,
					})
				}
			}
		}) as FocusEventHandler<HTMLInputElement | HTMLSelectElement>,
		onFocus: ((e) => {
			e.target.dataset.value_on_focus = e.target.value
		}) as FocusEventHandler<HTMLInputElement | HTMLSelectElement>,
	}
}
