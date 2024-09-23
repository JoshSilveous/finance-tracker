interface StandardError {
	message: string
}
export function isStandardError(error: any): error is StandardError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as any).message === 'string'
	)
}
