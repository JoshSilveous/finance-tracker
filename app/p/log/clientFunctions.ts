'use client'

import { createClient, getUserID } from '@/utils/supabase/client'

const supabase = createClient()

export async function fetchDataTest() {
	console.log('fetching transaction data...')
	const { data, error } = await supabase
		.from('transactions')
		.select(
			`
            id, 
            user_id, 
            name, 
            date,
            order_position,
            items:transaction_items (
                id, 
                user_id, 
                name, 
                amount, 
                category_id, 
                account_id, 
                transaction_id, 
                order_position
            )
        `
		)
		.order('date')
		.order('order_position', { referencedTable: 'transaction_items' })

	if (error) {
		throw new Error(error.message)
	}
	console.log('fetched! result:')
	console.log(data)
	return data as Transaction.Full[]
}
