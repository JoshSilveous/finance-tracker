import { useEffect } from 'react'

interface UseKeyListenerProps {
	// focusElem: HTMLElement
	listeners: {
		char: string
		ctrlKey?: boolean
		shiftKey?: boolean
		altKey?: boolean
		run: () => void
	}[]
}

export function useKeyListener({ listeners }: UseKeyListenerProps) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			listeners.forEach((listener) => {
				if (e.key.toUpperCase() !== listener.char.toUpperCase()) {
					return
				}
				if (listener.ctrlKey !== undefined && e.ctrlKey !== listener.ctrlKey) {
					return
				}
				if (listener.shiftKey !== undefined && e.shiftKey !== listener.shiftKey) {
					return
				}
				if (listener.altKey !== undefined && e.altKey !== listener.altKey) {
					return
				}
				e.preventDefault()
				listener.run()
			})
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [])
}
