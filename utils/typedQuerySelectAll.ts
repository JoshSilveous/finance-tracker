/**
 * `document.querySelectorAll` but returns an array instead of NodeList. Allows access to array methods
 */
export function typedQuerySelectAll<T>(query: string) {
	return Array.from(document.querySelectorAll(query)) as T[]
}
