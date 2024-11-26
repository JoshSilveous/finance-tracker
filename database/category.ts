'use client'
import { createClient, getUserID } from '@/utils/supabase/client'
const supabase = createClient()

export interface FetchedCategory {
	id: string
	name: string
	order_position: number
}
export async function fetchCategoryData() {
	const { data, error } = await supabase
		.from('categories')
		.select('id, name, order_position')
		.order('order_position')
	if (error) {
		throw new Error(error.message)
	}
	return data as FetchedCategory[]
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

export async function getCategoryCountAssocWithTransaction(category_id: string) {
	const { count, error } = await supabase
		.from('transactions')
		.select('*', { count: 'exact', head: true })
		.eq('category_id', category_id)
	if (error) {
		throw new Error(error.message)
	}
	return count as number
}

export interface InsertCategoryEntry {
	name: string
}
export async function insertCategory(category: InsertCategoryEntry) {
	const user_id = await getUserID()

	const numOfCategories = await getCategoryCount()

	const newCategory = {
		...category,
		user_id: user_id,
		order_position: numOfCategories!,
	}

	const { error } = await supabase.from('categories').insert([newCategory])

	if (error) {
		throw new Error(error.message)
	}
	return
}

export interface UpsertCategoryEntry {
	id: string
	name: string
	order_position: number
}
export async function upsertCategories(categoryUpdates: UpsertCategoryEntry[]) {
	const user_id = await getUserID()

	const categoryUpdatesWithUserID = categoryUpdates.map((item) => {
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

export async function deleteCategoryAndTransactions(category_id: string) {
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

export async function deleteCategoryAndSetNull(category_id: string) {
	// by default, transactions category_id are set null when associated category is deleted
	const res = await supabase.from('categories').delete().eq('id', category_id)

	if (res.error) {
		throw new Error(res.error.message)
	}
}

export async function deleteCategoryAndReplace(
	category_id: string,
	new_category_id: string
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

interface CategoryTotal {
	category_id: Category.ID
	total_amount: number
}
export async function fetchCategoryTotals() {
	const { data, error } = await supabase.rpc('get_totals_by_category')
	if (error) {
		throw new Error(error.message)
	}
	return data as CategoryTotal[]
}
