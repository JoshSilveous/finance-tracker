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
				console.log(e.key, e.ctrlKey, e.shiftKey)
				if (e.key.toUpperCase() !== listener.char.toUpperCase()) {
					console.log('    fail 1')
					return
				}
				console.log('    pass 1')
				if (listener.ctrlKey !== undefined && e.ctrlKey !== listener.ctrlKey) {
					console.log('    fail 2')
					return
				}
				console.log('    pass 2')
				if (listener.shiftKey !== undefined && e.shiftKey !== listener.shiftKey) {
					console.log('    fail 3')
					return
				}
				console.log('    pass 3')
				if (listener.altKey !== undefined && e.altKey !== listener.altKey) {
					console.log('    fail 4')
					return
				}
				console.log('    pass 4')
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
