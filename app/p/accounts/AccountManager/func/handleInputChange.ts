import { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Change } from '../AccountManager'
import { removeFromArray } from '@/utils'

export function handleInputChange(
	e: ChangeEvent<HTMLInputElement>,
	pendingChanges: Change[],
	setPendingChanges: Dispatch<SetStateAction<Change[]>>
) {
	// prevent leading spaces
	if (e.target.value !== e.target.value.trimStart()) {
		e.target.value = e.target.value.trimStart()
	}

	const account_id = e.target.dataset['id'] as Account.ID
	const key = e.target.dataset['key'] as keyof Change['new']
	const defaultValue = e.target.dataset['default'] as string
	const currentValue = e.target.value

	const thisPendingChangeIndex = pendingChanges.findIndex(
		(change) => change.account_id === account_id
	)
	const thisPendingChange =
		thisPendingChangeIndex !== -1 ? pendingChanges[thisPendingChangeIndex] : undefined

	if (defaultValue === currentValue) {
		// if new val equals starting value, remove change item

		if (thisPendingChange === undefined) {
			return
		}

		if (Object.keys(thisPendingChange.new).length > 1) {
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
	} else if (thisPendingChangeIndex === -1) {
		// if change isn't already present in pendingChanges
		setPendingChanges((prev) => [
			...prev,
			{
				account_id,
				new: { [key]: currentValue },
			},
		])
	} else {
		// if change is already present in pendingChanges
		setPendingChanges((prev) => {
			const newArr = [...prev]
			newArr[thisPendingChangeIndex].new[key] = currentValue
			return newArr
		})
	}
}
