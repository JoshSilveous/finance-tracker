import { MutableRefObject, SetStateAction } from 'react'
import { Change } from '../AccountManager'

interface HistoryItemReorder {
	action: 'reorder'
	oldIndex: number
	newIndex: number
}
interface HistoryItemValueChange {
	action: 'value_change'
	account_id: string
	key: keyof Account.Bare
	oldVal: string
	newVal: string
}
export type HistoryItem = HistoryItemReorder | HistoryItemValueChange

export function undoMostRecentAction(
	undoHistoryStackRef: MutableRefObject<HistoryItem[]>,
	setCurrentSortOrder: (value: SetStateAction<string[]>) => void,
	pendingChangesRef: MutableRefObject<Change[]>,
	setPendingChanges: (value: SetStateAction<Change[]>) => void,
	setUndoHistoryStack: (value: SetStateAction<HistoryItem[]>) => void,
	setRedoHistoryStack: (value: SetStateAction<HistoryItem[]>) => void
) {
	const mostRecentAction = undoHistoryStackRef.current.at(-1)!
	if (mostRecentAction.action === 'reorder') {
		// if we are undoing a sort action
		const { newIndex, oldIndex } = mostRecentAction
		setCurrentSortOrder((prev) => {
			const newArr = [...prev!]
			const [item] = newArr.splice(newIndex, 1)
			newArr.splice(oldIndex, 0, item)
			return newArr
		})
	} else {
		// if we are undoing a value change
		const { account_id, key, oldVal } = mostRecentAction

		const node = document.querySelector(
			`[data-id="${account_id}"][data-key="${key}"]`
		) as HTMLInputElement

		const thisPendingChangeIndex = pendingChangesRef.current.findIndex(
			(item) => item.account_id === account_id
		)

		if (thisPendingChangeIndex !== -1) {
			// if there is a pendingChange for this entry
			const thisPendingChange = pendingChangesRef.current[thisPendingChangeIndex]

			let defaultVal = node.dataset['default'] as string
			let returningToDefault = false
			if (
				(!isNaN(parseInt(defaultVal)) &&
					!isNaN(parseInt(oldVal)) &&
					parseInt(defaultVal) === parseInt(oldVal)) ||
				defaultVal === oldVal
			) {
				returningToDefault = true
			}

			if (returningToDefault) {
				// if we are returning to the default value
				if (
					(key === 'name' &&
						thisPendingChange.new.starting_amount === undefined) ||
					(key === 'starting_amount' && thisPendingChange.new.name === undefined)
				) {
					// if other keys don't exist on pendingChange, remove change
					setPendingChanges((prev) =>
						prev.filter((_, index) => index !== thisPendingChangeIndex)
					)
				} else {
					// if other keys DO exist on pendingChange, set key to undefined
					setPendingChanges((prev) => {
						const newArr = structuredClone(prev)
						newArr[thisPendingChangeIndex].new[key] = undefined
						return newArr
					})
				}
			} else {
				// set pendingChange to reflect the old value
				setPendingChanges((prev) => {
					const newArr = structuredClone(prev)
					newArr[thisPendingChangeIndex].new[key] = oldVal
					return newArr
				})
			}
		} else {
			// add a pendingChange
			setPendingChanges((prev) => [
				...prev,
				{ account_id: account_id, new: { [key]: oldVal } },
			])
		}
		node.focus()
	}
	setRedoHistoryStack((prev) => [...prev, mostRecentAction])
	setUndoHistoryStack((prev) => prev.slice(0, -1))
}

export function redoMostRecentAction(
	redoHistoryStackRef: MutableRefObject<HistoryItem[]>,
	setCurrentSortOrder: (value: SetStateAction<string[]>) => void,
	pendingChangesRef: MutableRefObject<Change[]>,
	setPendingChanges: (value: SetStateAction<Change[]>) => void,
	setUndoHistoryStack: (value: SetStateAction<HistoryItem[]>) => void,
	setRedoHistoryStack: (value: SetStateAction<HistoryItem[]>) => void
) {
	const mostRecentUndoAction = redoHistoryStackRef.current.at(-1)!
	if (mostRecentUndoAction.action === 'reorder') {
		// if we are redoing a sort action
		setCurrentSortOrder((prev) => {
			const newArr = [...prev!]
			const [item] = newArr.splice(mostRecentUndoAction.oldIndex, 1)
			newArr.splice(mostRecentUndoAction.newIndex, 0, item)
			return newArr
		})
	} else {
		// if we are redoing a value change
		const { account_id, key, newVal } = mostRecentUndoAction

		const node = document.querySelector(
			`[data-id="${account_id}"][data-key="${key}"]`
		) as HTMLInputElement

		const thisPendingChangeIndex = pendingChangesRef.current.findIndex(
			(item) => item.account_id === account_id
		)

		if (thisPendingChangeIndex !== -1) {
			// if there is a pendingChange for this entry
			const thisPendingChange = pendingChangesRef.current[thisPendingChangeIndex]

			let defaultVal = node.dataset['default'] as string
			let returningToDefault = false
			if (
				(!isNaN(parseInt(defaultVal)) &&
					!isNaN(parseInt(newVal)) &&
					parseInt(defaultVal) === parseInt(newVal)) ||
				defaultVal === newVal
			) {
				returningToDefault = true
			}

			if (returningToDefault) {
				// if we are returning to the default value
				if (
					(key === 'name' &&
						thisPendingChange.new.starting_amount === undefined) ||
					(key === 'starting_amount' && thisPendingChange.new.name === undefined)
				) {
					// if other keys don't exist on pendingChange, remove change
					setPendingChanges((prev) =>
						prev.filter((_, index) => index !== thisPendingChangeIndex)
					)
				} else {
					// if other keys DO exist on pendingChange, set key to undefined
					setPendingChanges((prev) => {
						const newArr = structuredClone(prev)
						newArr[thisPendingChangeIndex].new[key] = undefined
						return newArr
					})
				}
			} else {
				// set pendingChange to reflect the new value
				setPendingChanges((prev) => {
					const newArr = structuredClone(prev)
					newArr[thisPendingChangeIndex].new[key] = newVal
					return newArr
				})
			}
		} else {
			// add a pendingChange
			setPendingChanges((prev) => [
				...prev,
				{ account_id: account_id, new: { [key]: newVal } },
			])
		}
		node.focus()
	}
	setUndoHistoryStack((prev) => [...prev, mostRecentUndoAction])
	setRedoHistoryStack((prev) => prev.slice(0, -1))
}
