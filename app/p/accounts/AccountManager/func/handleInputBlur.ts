import { removeFromArray } from '@/utils'
import { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Change } from '../AccountManager'

export function handleInputBlur(
	e: ChangeEvent<HTMLInputElement>,
	pendingChanges: Change[],
	setPendingChanges: Dispatch<SetStateAction<Change[]>>
) {
	e.target.value = e.target.value.trimEnd()
	const defaultValue = e.target.dataset['default'] as string
	const currentValue = e.target.value
	console.log('blurring with currentValue:', currentValue)
	// handles edge case where the user just adds spaces to the end of the value
	// this will remove those spaces and the Change
	if (defaultValue === currentValue) {
		const account_id = e.target.dataset['id'] as Account.ID
		const key = e.target.dataset['key'] as keyof Change['new']

		const thisPendingChangeIndex = pendingChanges.findIndex(
			(change) => change.account_id === account_id
		)
		const thisPendingChange = pendingChanges[thisPendingChangeIndex]
		if (thisPendingChange?.new[key] === undefined) {
			return
		} else {
			if (Object.keys(thisPendingChange.new).length >= 1) {
				// remove this key from thisChange.new
				setPendingChanges((prev) => {
					const newArr = structuredClone(prev)
					delete newArr[thisPendingChangeIndex].new[key]
					return newArr
				})
			} else {
				// remove thisChange from pendingChanges
				setPendingChanges((prev) => removeFromArray(prev, thisPendingChangeIndex))
			}
		}
	}
}
