import { MutableRefObject } from 'react'
import { Change } from '../AccountManager'
import { FetchedAccount, upsertAccounts } from '@/database'

export async function saveChanges(
	data: FetchedAccount[] | null,
	currentSortOrderRef: MutableRefObject<string[]>,
	defaultSortOrderRef: MutableRefObject<string[]>,
	pendingChangesRef: MutableRefObject<Change[]>
) {
	const pendingChanges = pendingChangesRef.current

	// apply data changes
	const accountUpdates: FetchedAccount[] = pendingChanges.map((change) => {
		const thisAccount = data!.find(
			(item) => item.id === change.account_id
		) as FetchedAccount
		return {
			id: change.account_id,
			name: change.new.name === undefined ? thisAccount.name : change.new.name,
			order_position: thisAccount.order_position,
			starting_amount:
				change.new.starting_amount === undefined
					? thisAccount.starting_amount
					: Math.round(parseFloat(change.new.starting_amount) * 100) / 100,
		}
	})

	// apply re-ordering
	currentSortOrderRef.current.forEach((sortAccountID, sortIndex) => {
		if (defaultSortOrderRef.current[sortIndex] !== sortAccountID) {
			const thisUpdate = accountUpdates.find((update) => update.id === sortAccountID)
			if (thisUpdate === undefined) {
				const thisAccount = data!.find((item) => item.id === sortAccountID)!
				accountUpdates.push({
					id: sortAccountID,
					name: thisAccount.name,
					starting_amount: thisAccount.starting_amount,
					order_position: sortIndex,
				})
			} else {
				thisUpdate.order_position = sortIndex
			}
		}
	})

	await upsertAccounts(accountUpdates)
}
