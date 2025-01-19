type ListenerRegistry = {
	[key: string]: ListenerConfigItem<keyof WindowEventMap>
}
type ListenerConfigItem<T extends keyof WindowEventMap> = {
	type: T
	callback: (this: Window, ev: WindowEventMap[T]) => any
	isolated: boolean
}

const listenerRegistry: ListenerRegistry = {}

export function setWindowListener<T extends keyof WindowEventMap>(
	key: string,
	type: T,
	callback: (this: Window, ev: WindowEventMap[T]) => any
) {
	if (Object.keys(listenerRegistry).includes(key)) {
		const prevListener = listenerRegistry[key]
		window.removeEventListener(prevListener.type, prevListener.callback)
		delete listenerRegistry[key]
	}

	listenerRegistry[key] = { type, callback, isolated: false } as ListenerConfigItem<
		keyof WindowEventMap
	>

	// check if event type is currently isolated
	const typeIsCurrentlyIsolated = Object.entries(listenerRegistry).some(
		([key, config]) => {
			console.log('CHECKING', key, config)
			return config.type === type && config.isolated === true
		}
	)

	if (!typeIsCurrentlyIsolated) {
		window.addEventListener(type, callback)
	}
}

export function removeWindowListener(key: string) {
	if (Object.keys(listenerRegistry).includes(key)) {
		const listener = listenerRegistry[key]
		window.removeEventListener(listener.type, listener.callback)

		if (listener.isolated) {
			unisolateWindowListener(key)
		}

		delete listenerRegistry[key]
	}
}

export function isolateWindowListener(key: string) {
	if (Object.keys(listenerRegistry).includes(key)) {
		const thisListener = listenerRegistry[key]

		const otherListenersOfThisType = Object.entries(listenerRegistry)
			.map(([key, config]) => ({
				key: key,
				type: config.type,
				callback: config.callback,
			}))
			.filter((lstnr) => lstnr.type === thisListener.type && lstnr.key !== key)

		thisListener.isolated = true

		otherListenersOfThisType.forEach((lstnr) => {
			window.removeEventListener(lstnr.type, lstnr.callback)
		})
	}
}

export function unisolateWindowListener(key: string) {
	if (Object.keys(listenerRegistry).includes(key)) {
		const thisListener = listenerRegistry[key]

		const otherListenersOfThisType = Object.entries(listenerRegistry)
			.map(([key, config]) => ({
				key: key,
				type: config.type,
				callback: config.callback,
			}))
			.filter((lstnr) => lstnr.type === thisListener.type)

		thisListener.isolated = false

		otherListenersOfThisType.forEach((lstnr) => {
			window.addEventListener(lstnr.type, lstnr.callback)
		})
	}
}
