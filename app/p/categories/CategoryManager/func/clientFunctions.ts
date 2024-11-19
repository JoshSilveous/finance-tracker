'use client'

import { createClient, getUserID } from '@/utils/supabase/client'

const supabase = createClient()

export async function fetchData() {
	const { data, error } = await supabase
		.from('categories')
		.select('id, name, order_position')
		.order('order_position')
	if (error) {
		throw new Error(error.message)
	}
	return data as Category.WithPropsAndID[]
}

interface CategoryManagerPreferences {
	category_name_width: number
}
export async function fetchPreferredColumnWidths() {
	const { data, error } = await supabase
		.from('preferences')
		.select('category_name_width:CategoryManager_category_name_column_width')
	if (error) {
		throw new Error(error.message)
	}
	if (data.length === 0) {
		throw new Error('Preferences not found!')
	}
	const preferences: unknown = data[0]
	return preferences as CategoryManagerPreferences
}

export async function updatePreferredColumnWidth(columnIndex: number, newWidth: number) {
	let columnName: string
	switch (columnIndex) {
		case 0:
			columnName = 'CategoryManager_category_name_column_width'
			break
		default:
			throw new Error(`columnIndex "${columnIndex}" is not valid.`)
	}
	const user_id = await getUserID()

	const { error } = await supabase
		.from('preferences')
		.update({ [columnName]: newWidth })
		.eq('user_id', user_id)
	if (error) {
		throw new Error(error.message)
	}
	return
}

export async function upsertData(categoryUpdates: Category.WithPropsAndID[]) {
	const user_id = await getUserID()

	const categoryUpdatesWithUserID: Category.Full[] = categoryUpdates.map((item) => {
		return {
			...item,
			user_id: user_id,
		}
	})

	const { error } = await supabase.from('categories').upsert(categoryUpdatesWithUserID, {
		defaultToNull: false,
		onConflict: 'id',
		ignoreDuplicates: false,
	})
	if (error) {
		throw new Error(error.message)
	}

	return
}

export async function insertCategory(category: Category.Bare) {
	const user_id = await getUserID()

	const numOfCategories = await getCategoryCount()

	const newCategory: Category.WithPropsAndUser = {
		name: category.name,
		user_id: user_id,
		order_position: numOfCategories!,
	}

	const { error } = await supabase.from('categories').insert([newCategory])

	if (error) {
		throw new Error(error.message)
	}
	return
}

export async function getCategoryCount() {
	const { count, error } = await supabase
		.from('categories')
		.select('*', { count: 'exact', head: true })
	if (error) {
		throw new Error(error.message)
	}
	return count as number
}

export async function getAssociatedTransactionCount(category_id: Category.ID) {
	const { count, error } = await supabase
		.from('transactions')
		.select('*', { count: 'exact', head: true })
		.eq('category_id', category_id)
	if (error) {
		throw new Error(error.message)
	}
	return count as number
}

export async function deleteCategoryAndTransactions(category_id: Category.ID) {
	const transactionsUpdate = await supabase
		.from('transactions')
		.delete()
		.eq('category_id', category_id)

	if (transactionsUpdate.error) {
		throw new Error(transactionsUpdate.error.message)
	}

	const categoryDeleteRes = await supabase
		.from('categories')
		.delete()
		.eq('id', category_id)
	if (categoryDeleteRes.error) {
		throw new Error(categoryDeleteRes.error.message)
	}
}
export async function deleteCategoryAndSetNull(category_id: Category.ID) {
	// by default, transactions category_id are set null when associated category is deleted
	const res = await supabase.from('categories').delete().eq('id', category_id)

	if (res.error) {
		throw new Error(res.error.message)
	}
}
export async function deleteCategoryAndReplace(
	category_id: Category.ID,
	new_category_id: Category.ID
) {
	const transactionsUpdate = await supabase
		.from('transactions')
		.update({ category_id: new_category_id })
		.eq('category_id', category_id)

	if (transactionsUpdate.error) {
		throw new Error(transactionsUpdate.error.message)
	}

	const categoryDeleteRes = await supabase
		.from('categories')
		.delete()
		.eq('id', category_id)

	if (categoryDeleteRes.error) {
		throw new Error(categoryDeleteRes.error.message)
	}
}
