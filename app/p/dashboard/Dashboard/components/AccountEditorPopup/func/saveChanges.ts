import {
	insertAccounts,
	deleteAccountAndTransactions,
	deleteAccountAndSetNull,
	deleteAccountAndReplace,
	UpsertAccountEntry,
	upsertAccounts,
} from '@/database'
import { AccountItem, DeleteActItem } from '../AccountEditorPopup'
import { MutableRefObject } from 'react'

export async function saveChanges(
	actData: AccountItem[],
	sortOrder: string[],
	deletedAccounts: DeleteActItem[],
	defSortOrder: MutableRefObject<string[]>
) {
	// create new accounts
	const newAccounts = actData.filter((act) => act.id.startsWith('PENDING_CREATION'))
	const newIDMap: { [pendingId: string]: string } = {}
	const newAccountPromises = newAccounts.map((act) => {
		return insertAccounts({
			name: act.name.val,
			starting_amount: Number(act.starting_amount.val),
			order_position: sortOrder.indexOf(act.id),
		}).then((new_id) => {
			newIDMap[act.id] = new_id
		})
	})
	await Promise.all(newAccountPromises)

	/* 	make sure id replacement chains are resolved
                e.x.:
                    { id: 'cat1', method: 'replace', new_id: 'cat2' },
                    { id: 'cat2', method: 'replace', new_id: 'cat3' }
                    turns into
                    { id: 'cat1', method: 'replace', new_id: 'cat3' },
                    { id: 'cat2', method: 'replace', new_id: 'cat3' }
            */
	const idsUsedForReplacement: string[] = []
	deletedAccounts.forEach((item) => {
		if (item.method === 'replace') {
			idsUsedForReplacement.push(item.new_id!)
		}
	})
	deletedAccounts.forEach((item) => {
		if (item.method === 'replace' && idsUsedForReplacement.includes(item.id)) {
			deletedAccounts.forEach((item2) => {
				if (item2.method === 'replace' && item2.new_id === item.id) {
					item2.new_id = item.new_id
				}
			})
		}
	})
	const deleteAccountPromises = deletedAccounts.map((item) => {
		if (item.id.startsWith('PENDING_CREATION')) {
			item.id = newIDMap[item.id]
		}
		if (item.new_id && item.new_id.startsWith('PENDING_CREATION')) {
			item.new_id = newIDMap[item.new_id!]
		}
		if (item.method === 'delete') {
			return deleteAccountAndTransactions(item.id)
		} else if (item.method === 'set_null') {
			return deleteAccountAndSetNull(item.id)
		} else if (item.method === 'replace') {
			return deleteAccountAndReplace(item.id, item.new_id!)
		}
	})

	await Promise.all(deleteAccountPromises)

	// upsert remaining changes
	const accountUpserts: UpsertAccountEntry[] = (() => {
		const accountUpserts: UpsertAccountEntry[] = []
		actData.forEach((act) => {
			if (act.id.startsWith('PENDING_CREATION')) {
				return
			}
			const newOrderPos = sortOrder.indexOf(act.id)
			const origOrderPos = defSortOrder.current.indexOf(act.id)
			if (
				newOrderPos !== origOrderPos ||
				act.name.changed ||
				act.starting_amount.changed
			) {
				accountUpserts.push({
					id: act.id,
					name: act.name.val,
					starting_amount: Number(act.starting_amount.val),
					order_position: newOrderPos,
				})
			}
		})
		return accountUpserts
	})()

	await upsertAccounts(accountUpserts)
}
