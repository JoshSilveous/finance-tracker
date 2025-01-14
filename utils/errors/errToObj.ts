/**
 * Converts an `Error` into it's object form, so properties can be properly accessed
 * ```ts
 *  interface ErrorObject {
 *      name: string
 *      message: string
 *      stack?: string
 *      cause: unknown
 *  }
 * ```
 */
export function errToObj(error: Error) {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
		cause: error.cause,
	} as ErrorObject
}
export interface ErrorObject {
	name: string
	message: string
	stack?: string
	cause: unknown
}
