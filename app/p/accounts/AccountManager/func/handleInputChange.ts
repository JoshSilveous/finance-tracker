import { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Change, HistoryItem } from '../AccountManager'
import { removeFromArray } from '@/utils'

export function handleInputChange(
	e: ChangeEvent<HTMLInputElement>,
	pendingChanges: Change[],
	setPendingChanges: Dispatch<SetStateAction<Change[]>>,
	undoHistoryStack: HistoryItem[],
	setUndoHistoryStack: Dispatch<SetStateAction<HistoryItem[]>>,
	setRedoHistoryStack: Dispatch<SetStateAction<HistoryItem[]>>
) {
	// prevent leading spaces
	if (e.target.value !== e.target.value.trimStart()) {
		e.target.value = e.target.value.trimStart()
	}

	const account_id = e.target.dataset['id'] as Account.ID
	const key = e.target.dataset['key'] as keyof Change['new']
	const defaultValue = e.target.dataset['default'] as string
	const currentValue = e.target.value

	// undo/redo history logic
	setUndoHistoryStack((prev) => {
		if (prev.length !== 0) {
			const mostRecentAction = prev.at(-1)!
			if (
				mostRecentAction.action === 'value_change' &&
				mostRecentAction.account_id === account_id &&
				mostRecentAction.key === key
			) {
				const newArr = [...prev]
				newArr[newArr.length - 1] = {
					action: 'value_change',
					account_id: account_id,
					key: key,
					oldVal: mostRecentAction.oldVal,
					newVal: currentValue,
				}
				return newArr
			} else {
				return [
					...prev,
					{
						action: 'value_change',
						account_id: account_id,
						key: key,
						oldVal:
							e.target.dataset['value_on_focus'] !== undefined
								? e.target.dataset['value_on_focus']
								: defaultValue,
						newVal: currentValue,
					},
				]
			}
		} else {
			return [
				{
					action: 'value_change',
					account_id: account_id,
					key: key,
					oldVal:
						e.target.dataset['value_on_focus'] !== undefined
							? e.target.dataset['value_on_focus']
							: defaultValue,
					newVal: currentValue,
				},
			]
		}
	})
	console.log('inputChange ran')
	setRedoHistoryStack([])

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
