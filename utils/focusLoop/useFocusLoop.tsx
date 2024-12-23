import { RefObject, useEffect } from 'react'

/**
 * Creates a focus loop that will restrict `tab` navigation between two nodes.
 * @param firstRef The `ref` that points to the first node in the loop
 * @param lastRef  The `ref` that points to the last node in the loop
 */
export function useFocusLoop(
	firstRef: RefObject<HTMLElement>,
	lastRef: RefObject<HTMLElement>
) {
	useEffect(() => {
		if (firstRef.current !== null && lastRef.current !== null) {
			firstRef.current.addEventListener('keydown', onFirstRefKeydown)
			lastRef.current.addEventListener('keydown', onLastRefKeyboard)
		}

		function onFirstRefKeydown(e: KeyboardEvent) {
			if (e.key === 'Tab' && e.shiftKey) {
				e.preventDefault()
				if (lastRef.current !== null) {
					lastRef.current.focus()
				}
			}
		}

		function onLastRefKeyboard(e: KeyboardEvent) {
			if (e.key === 'Tab' && !e.shiftKey) {
				e.preventDefault()
				if (firstRef.current !== null) {
					firstRef.current.focus()
				}
			}
		}

		return () => {
			if (firstRef.current !== null && lastRef.current !== null) {
				firstRef.current.removeEventListener('keydown', onFirstRefKeydown)
				lastRef.current.removeEventListener('keydown', onLastRefKeyboard)
			}
		}
	}, [firstRef.current, lastRef.current])
}
