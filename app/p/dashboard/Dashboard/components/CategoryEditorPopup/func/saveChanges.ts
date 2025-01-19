import {
	insertCategories,
	deleteCategoryAndTransactions,
	deleteCategoryAndSetNull,
	deleteCategoryAndReplace,
	UpsertCategoryEntry,
	upsertCategories,
} from '@/database'
import { CategoryItem, DeleteCatItem } from '../CategoryEditorPopup'
import { MutableRefObject } from 'react'

export async function saveChanges(
	catData: CategoryItem[],
	sortOrder: string[],
	deletedCategories: DeleteCatItem[],
	defSortOrder: MutableRefObject<string[]>
) {
	// create new categories
	const newCategories = catData.filter((cat) => cat.id.startsWith('PENDING_CREATION'))
	const newIDMap: { [pendingId: string]: string } = {}
	const newCategoryPromises = newCategories.map((cat) => {
		return insertCategories({
			name: cat.name.val,
			order_position: sortOrder.indexOf(cat.id),
		}).then((new_id) => {
			newIDMap[cat.id] = new_id
		})
	})
	await Promise.all(newCategoryPromises)

	/* 	make sure id replacement chains are resolved
                e.x.:
                    { id: 'cat1', method: 'replace', new_id: 'cat2' },
                    { id: 'cat2', method: 'replace', new_id: 'cat3' }
                    turns into
                    { id: 'cat1', method: 'replace', new_id: 'cat3' },
                    { id: 'cat2', method: 'replace', new_id: 'cat3' }
            */
	const idsUsedForReplacement: string[] = []
	deletedCategories.forEach((item) => {
		if (item.method === 'replace') {
			idsUsedForReplacement.push(item.new_id!)
		}
	})
	deletedCategories.forEach((item) => {
		if (item.method === 'replace' && idsUsedForReplacement.includes(item.id)) {
			deletedCategories.forEach((item2) => {
				if (item2.method === 'replace' && item2.new_id === item.id) {
					item2.new_id = item.new_id
				}
			})
		}
	})
	const deleteCategoryPromises = deletedCategories.map((item) => {
		if (item.id.startsWith('PENDING_CREATION')) {
			item.id = newIDMap[item.id]
		}
		if (item.new_id && item.new_id.startsWith('PENDING_CREATION')) {
			item.new_id = newIDMap[item.new_id!]
		}
		if (item.method === 'delete') {
			return deleteCategoryAndTransactions(item.id)
		} else if (item.method === 'set_null') {
			return deleteCategoryAndSetNull(item.id)
		} else if (item.method === 'replace') {
			return deleteCategoryAndReplace(item.id, item.new_id!)
		}
	})

	await Promise.all(deleteCategoryPromises)

	// upsert remaining changes
	const categoryUpserts: UpsertCategoryEntry[] = (() => {
		const categoryUpserts: UpsertCategoryEntry[] = []
		catData.forEach((cat) => {
			if (cat.id.startsWith('PENDING_CREATION')) {
				return
			}
			const newOrderPos = sortOrder.indexOf(cat.id)
			const origOrderPos = defSortOrder.current.indexOf(cat.id)
			if (newOrderPos !== origOrderPos || cat.name.changed) {
				categoryUpserts.push({
					id: cat.id,
					name: cat.name.val,
					order_position: newOrderPos,
				})
			}
		})
		return categoryUpserts
	})()

	await upsertCategories(categoryUpserts)
}
