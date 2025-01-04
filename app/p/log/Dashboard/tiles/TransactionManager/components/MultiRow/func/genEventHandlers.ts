import { ChangeEventHandler, FocusEventHandler } from 'react'
import { MultiRowProps } from '../MultiRow'

export function genEventHandlers(p: MultiRowProps) {
	return {
		onChange: ((e) => {
			const key = e.target.dataset.key as
				| 'date'
				| 'name'
				| 'amount'
				| 'category_id'
				| 'account_id'
			const item_id = e.target.dataset.item_id
			const newVal = e.target.value

			p.historyController.clearRedo()

			if (item_id === undefined) {
				if (key === 'date' || key === 'name') {
					p.data.update('transaction', p.transaction.id, key, newVal)
				}
			} else {
				if (
					key === 'name' ||
					key === 'amount' ||
					key === 'category_id' ||
					key === 'account_id'
				) {
					p.data.update('item', item_id, p.transaction.id, key, newVal)
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
				| 'date'
				| 'name'
				| 'amount'
				| 'category_id'
				| 'account_id'
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
