import { RefObject, useEffect } from 'react'

/**
 * Creates a focus loop that will restrict `tab` navigation between two nodes.
 * @param firstRef The `ref` that points to the first node in the loop, or an array of nodes
 * @param firstRefIndex Required if `firstRef` points to an array of nodes instead of a single node
 * @param lastRef  The `ref` that points to the last node in the loop, or an array of nodes
 * @param lastRefIndex Required if `lastRef` points to an array of nodes instead of a single node
 */
export function useFocusLoop({
	firstRef,
	firstRefIndex,
	lastRef,
	lastRefIndex,
}: {
	firstRef: RefObject<HTMLElement | HTMLElement[]>
	firstRefIndex?: number
	lastRef: RefObject<HTMLElement | HTMLElement[]>
	lastRefIndex?: number
}) {
	if (Array.isArray(firstRef.current) && firstRefIndex === undefined) {
		throw new Error(
			'firstRefIndex must be defined if firstRef is referencing an array of nodes!'
		)
	}
	if (Array.isArray(lastRef.current) && lastRefIndex === undefined) {
		throw new Error(
			'lastRefIndex must be defined if lastRef is referencing an array of nodes!'
		)
	}
	const firstNode = Array.isArray(firstRef.current)
		? firstRef.current[firstRefIndex!]
		: firstRef.current
	const lastNode = Array.isArray(lastRef.current)
		? lastRef.current[lastRefIndex!]
		: lastRef.current

	useEffect(() => {
		if (firstNode && lastNode) {
			firstNode.addEventListener('keydown', onFirstRefKeydown)
			lastNode.addEventListener('keydown', onLastRefKeyboard)
		}

		function onFirstRefKeydown(e: KeyboardEvent) {
			if (e.key === 'Tab' && e.shiftKey) {
				e.preventDefault()
				if (lastNode) {
					lastNode.focus()
				}
			}
		}

		function onLastRefKeyboard(e: KeyboardEvent) {
			if (e.key === 'Tab' && !e.shiftKey) {
				e.preventDefault()
				if (firstNode) {
					firstNode.focus()
				}
			}
		}

		return () => {
			if (firstNode && lastNode) {
				firstNode.removeEventListener('keydown', onFirstRefKeydown)
				lastNode.removeEventListener('keydown', onLastRefKeyboard)
			}
		}
	}, [firstNode, lastNode])
}
