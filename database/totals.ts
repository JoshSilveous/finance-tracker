'use client'
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
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

interface AccountTotal {
	account_id: Category.ID
	total_amount: number
}
export async function fetchAccountTotals() {
	const { data, error } = await supabase.rpc('get_totals_by_account')
	if (error) {
		throw new Error(error.message)
	}
	return data as AccountTotal[]
}