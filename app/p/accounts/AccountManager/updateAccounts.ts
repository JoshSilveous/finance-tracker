'use client'
import { createClient } from '@/utils/supabase/client'

export async function updateAccounts(accounts: AccountFull[]) {
	const supabase = createClient()

	const { data, error } = await supabase.from('accounts').upsert(accounts, {
		defaultToNull: false,
		onConflict: 'id',
		ignoreDuplicates: false,
	})

	if (error) {
		console.log('ERROR:', error)
		console.log('ERROR DATA:', data)
	} else {
		console.log('NO ERROR:', data)
	}
	// i need to make the Change items contain all of the row's data. All data needs to be passed through the upsert
}
