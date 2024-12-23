import { MutableRefObject } from 'react'
import { Change } from '../CategoryManager'
import { evaluate } from 'mathjs'
import { FetchedCategory, upsertCategories } from '@/database'

export async function saveChanges(
	data: FetchedCategory[] | null,
	currentSortOrderRef: MutableRefObject<string[]>,
	defaultSortOrderRef: MutableRefObject<string[]>,
	pendingChangesRef: MutableRefObject<Change[]>
) {
	const pendingChanges = pendingChangesRef.current

	// apply data changes
	const categoryUpdates: FetchedCategory[] = pendingChanges.map((change) => {
		const thisCategory = data!.find(
			(item) => item.id === change.category_id
		) as FetchedCategory
		return {
			id: change.category_id,
			name: change.new.name === undefined ? thisCategory.name : change.new.name,
			order_position: thisCategory.order_position,
		}
	})

	// apply re-ordering
	currentSortOrderRef.current.forEach((sortCategoryID, sortIndex) => {
		if (defaultSortOrderRef.current[sortIndex] !== sortCategoryID) {
			const thisUpdate = categoryUpdates.find((update) => update.id === sortCategoryID)
			if (thisUpdate === undefined) {
				const thisCategory = data!.find((item) => item.id === sortCategoryID)!
				categoryUpdates.push({
					id: sortCategoryID,
					name: thisCategory.name,
					order_position: sortIndex,
				})
			} else {
				thisUpdate.order_position = sortIndex
			}
		}
	})

	await upsertCategories(categoryUpdates)
}
