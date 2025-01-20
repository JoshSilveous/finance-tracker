const intervalRegistry: {
	[key: string]: {
		delay: number
		callback: () => any
		cleanup?: () => any
		assignedID: NodeJS.Timeout
	}
} = {}

export function setGlobalInterval(
	key: string,
	delay: number,
	callback: () => any,
	cleanup?: () => any
) {
	const prevInterval = intervalRegistry[key]
	if (prevInterval !== undefined) {
		console.log('overriding,', prevInterval)
		if (prevInterval.cleanup) {
			prevInterval.cleanup()
		}
		clearInterval(prevInterval.assignedID)
		delete intervalRegistry[key]
	}

	const assignedID = setInterval(() => {
		if (Object.keys(intervalRegistry).includes(key)) {
			callback()
		}
	}, delay)
	intervalRegistry[key] = {
		assignedID,
		callback,
		delay,
		cleanup,
	}
}

export function clearGlobalInterval(key: string) {
	const interval = intervalRegistry[key]
	console.log('clearing', interval)
	if (interval !== undefined) {
		if (interval.cleanup) {
			interval.cleanup()
		}
		clearInterval(interval.assignedID)
		delete intervalRegistry[key]
	}
}
