import { useCallback, useEffect, useRef, useState } from 'react'
import { Data } from '../../Dashboard/hooks/useData/useData'

export function useFoldState() {
	const [foldState, setFoldState] = useState<FoldState>({})
	const foldStateRef = useRef<FoldState>({})
	useEffect(() => {
		foldStateRef.current = foldState
	}, [foldState])

	const genDefaultFoldState = (transactions: Data.StateTransaction[]) => {
		const foldState: FoldState = {}
		transactions.forEach((transaction) => {
			if (transaction.items.length > 1) {
				foldState[transaction.id] = false
			}
		})
		setFoldState(foldState)
	}

	const updateFoldState: FoldStateUpdater = useCallback((transaction_id, folded) => {
		setFoldState((prev) => {
			const newState = structuredClone(prev)
			newState[transaction_id] =
				folded !== undefined ? folded : !newState[transaction_id]
			return newState
		})
	}, [])

	const getFoldState: FoldStateGetter = useCallback(
		(transaction_id: string) => foldStateRef.current[transaction_id],
		[]
	)

	return {
		cur: foldState,
		set: setFoldState,
		update: updateFoldState,
		get: getFoldState,
		genDefault: genDefaultFoldState,
	}
}

/**
 * Keeps track of multi-rows and whether or not they are folded.
 *
 * @example
 * ```ts
 * const foldState: FoldState = {
 *     "transaction_1": false,
 *     "transaction_2": true
 * }
 * ```
 */
export type FoldState = {
	[id: string]: boolean
}

/**
 * Used to update a specific transaction's `foldState` in a concise way.
 * @param transaction_id
 * @param folded the value to set the `foldState` to. Leave undefined to toggle.
 */
export type FoldStateUpdater = (transaction_id: string, folded?: boolean) => void

export type FoldStateGetter = (transaction_id: string) => boolean
