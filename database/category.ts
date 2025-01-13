'use client'
import { createClient, getUserID } from '@/database/supabase/client'
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
		.from('transaction_items')
		.select('*', { count: 'exact', head: true })
		.eq('category_id', category_id)
	if (error) {
		throw new Error(error.message)
	}
	return count as number
}

export interface InsertCategoryEntry {
	name: string
	order_position: number
}
export async function insertCategory(category: InsertCategoryEntry) {
	const user_id = await getUserID()

	const newCategory = {
		...category,
		user_id: user_id,
	}

	const { data, error } = await supabase
		.from('categories')
		.insert([newCategory])
		.select('id')

	if (error) {
		throw new Error(error.message)
	}
	return data[0].id as string
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
	const { error } = await supabase.rpc('delete_category_and_associated_items', {
		category_id_input: category_id,
	})

	if (error) {
		throw new Error(error.message)
	}

	return
}

export async function deleteCategoryAndSetNull(category_id: string) {
	const { error } = await supabase.rpc('delete_category_and_null_associated_items', {
		category_id_input: category_id,
	})

	if (error) {
		throw new Error(error.message)
	}

	return
}

export async function deleteCategoryAndReplace(
	category_id: string,
	new_category_id: string
) {
	const { error } = await supabase.rpc('delete_category_and_replace_associated_items', {
		category_id_input: category_id,
		new_category_id,
	})

	if (error) {
		throw new Error(error.message)
	}

	return
}

export interface CategoryTotal {
	category_id: string
	total_amount: number
}
export async function fetchCategoryTotals() {
	const { data, error } = await supabase.rpc('get_totals_by_category')
	if (error) {
		throw new Error(error.message)
	}
	return data as CategoryTotal[]
}

/**
 * Within those two dates INCLUDING startDate and endDate
 * @param startDate
 * @param endDate
 * @returns
 */
export async function fetchCategoryTotalsWithinDateRange(
	startDate: string,
	endDate: string
) {
	const { data, error } = (await supabase.rpc('get_totals_by_category_within_dates', {
		start_date: startDate,
		end_date: endDate,
	})) as {
		data: CategoryTotal[]
		error: any
	}

	if (error) {
		throw new Error(error.message)
	}

	return data.map((item) =>
		item.category_id === null
			? { category_id: '', total_amount: item.total_amount }
			: item
	) as CategoryTotal[]
}
