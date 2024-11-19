'use client'
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
export interface FetchedTransaction {
	id: string
	date: string
	name: string
	order_position: number
	items: {
		id: string
		account_id: string | null
		category_id: string | null
		name: string
		amount: number
		order_position: number
	}[]
}
export async function fetchTransactionData() {
	const { data, error } = await supabase.rpc('get_transactions_with_items')
	if (error) {
		throw new Error(error.message)
	}
	return data as FetchedTransaction[]
}
