import { MutableRefObject, SetStateAction } from 'react'
import { fetchData, fetchPreferredColumnWidths } from '.'
import { createPreferencesEntry, isStandardError, promptError } from '@/utils'

export async function fetchAndLoadData(
	setIsLoading: (value: SetStateAction<boolean>) => void,
	gridRowRefs: MutableRefObject<HTMLDivElement[]>,
	setDefaultColumnWidths: (value: SetStateAction<number[]>) => void,
	setData: (value: SetStateAction<Category.Full[] | null>) => void,
	setCurrentSortOrder: (value: SetStateAction<string[]>) => void,
	setDefaultSortOrder: (value: SetStateAction<string[]>) => void
) {
	setIsLoading(true)
	gridRowRefs.current = []
	try {
		const columnWidths = await fetchPreferredColumnWidths()
		setDefaultColumnWidths([columnWidths.category_name_width])
	} catch (e) {
		if (isStandardError(e)) {
			if (e.message === 'Preferences not found!') {
				try {
					await createPreferencesEntry()
					const columnWidths = await fetchPreferredColumnWidths()
					setDefaultColumnWidths([columnWidths.category_name_width])
				} catch (e) {
					if (isStandardError(e)) {
						promptError(
							'An unexpected error has occurred while propagating table layout preferences in the database:',
							e.message,
							'Try refreshing the page to resolve this issue.'
						)
					}
				}
			} else {
				promptError(
					'An unexpected error has occured while fetching table layout preferences in the database:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
			}
		}
	}
	try {
		const data = await fetchData()
		setData(data)
		setIsLoading(false)
		const sortOrder = data.map((item) => item.id)
		setCurrentSortOrder(sortOrder)
		setDefaultSortOrder(sortOrder)
	} catch (e) {
		if (isStandardError(e)) {
			promptError(
				'An unexpected error has occured while fetching your data:',
				e.message,
				'Try refreshing the page to resolve this issue.'
			)
		} else {
			console.error(e)
		}
	}
}
