'use client'
export type IsolatedKeyListener = {
	context: string
	char: string
	ctrlKey?: boolean
	shiftKey?: boolean
	altKey?: boolean
	run: (e: KeyboardEvent) => void
	preventDefault?: boolean
}

let curContext = ''
let curListeners: IsolatedKeyListener[] = []

/**
 * Adds keydown listener(s) with specified parameters, that will only run when `IsolatedKeyListener.context` is the current active context.
 *
 * Current global context can be set with `setKeyListenerContext()`. This allows multiple window keydown handlers to be defined once, and will only run when the contexts matches.
 *
 * For example, this can be handy when `CTRL+Z` is used to undo. This function shouldn't work when a popup is active, so you can simply run `setKeyListenerContext` when the popup is activated to change context and prevent those old listeners.
 */
export function addIsolatedKeyListeners(
	listeners: IsolatedKeyListener | IsolatedKeyListener[]
) {
	if (Array.isArray(listeners)) {
		curListeners.push(...listeners)
	} else {
		curListeners.push(listeners)
	}
}

/**
 * Removes isolated key listener(s). Listener passed to this function must match the one you'd like to remove by reference.
 * Only needed when unmounting components.
 */
export function removeIsolatedKeyListeners(
	listeners: IsolatedKeyListener | IsolatedKeyListener[]
) {
	if (Array.isArray(listeners)) {
		curListeners = curListeners.filter(
			(thisListener) =>
				listeners.findIndex((listener) => listener === thisListener) === -1
		)
	} else {
		curListeners = curListeners.filter((thisListener) => thisListener !== listeners)
	}
}

/**
 * Sets the current global key listener context. Only listners with the matching `context` will run once changed.
 *
 * e.x. use this when a popup is activated to prevent the default key listeners from running.
 */
export function setKeyListenerContext(context: string) {
	curContext = context
}

function listenerDistributor(e: KeyboardEvent) {
	const activeListeners = curListeners.filter(
		(listener) => listener.context === curContext
	)
	activeListeners.forEach((listener) => {
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
		if (listener.preventDefault) {
			e.preventDefault()
		}
		listener.run(e)
	})
}

// prevents attempts to run on the node server
if (typeof window !== 'undefined') {
	window.addEventListener('keydown', listenerDistributor)
}
