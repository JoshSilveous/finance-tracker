import { MutableRefObject } from 'react'
import { Change } from '../AccountManager'
import { upsertData } from './clientFunctions'
import { evaluate } from 'mathjs'

export async function saveChanges(
	data: Account.Full[] | null,
	currentSortOrder: string[] | null,
	defaultSortOrder: string[] | null,
	pendingChangesRef: MutableRefObject<Change[]>
) {
	const pendingChanges = pendingChangesRef.current

	// apply data changes
	const accountUpdates: Account.WithPropsAndID[] = pendingChanges.map((change) => {
		const thisAccount = data!.find(
			(item) => item.id === change.account_id
		) as Account.Full
		return {
			id: change.account_id,
			name: change.new.name === undefined ? thisAccount.name : change.new.name,
			order_position: thisAccount.order_position,
			starting_amount:
				change.new.starting_amount === undefined
					? thisAccount.starting_amount
					: Math.round(parseFloat(evaluate(change.new.starting_amount)) * 100) /
					  100,
		}
	})

	// apply re-ordering
	currentSortOrder!.forEach((sortAccountID, sortIndex) => {
		if (defaultSortOrder![sortIndex] !== sortAccountID) {
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

	await upsertData(accountUpdates)
}
