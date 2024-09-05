'use client'
import { createClient } from '@/utils/supabase/client'

interface AccountFull {
	id: string
	name: string
	starting_amount: number
	user_id: string
}
export async function updateAccounts(accounts: AccountFull[]) {
	// const supabase = createClient()
	// const {
	// 	data: { user },
	// 	error: userError,
	// } = await supabase.auth.getUser()
	// if (userError) {
	// 	return { error: `User error: ${userError}` }
	// }
	// const formattedChanges = changes.map((change) => ({
	// 	id: change.account_id,
	// 	[change.key]: change.newVal,
	// 	user_id: user!.id,
	// }))
	// console.log('formattedChanges', formattedChanges)
	// const { data, error } = await supabase
	// 	.from('accounts')
	// 	.upsert(formattedChanges, {
	// 		defaultToNull: false,
	// 		onConflict: 'id',
	// 		ignoreDuplicates: false,
	// 	})
	// 	.select('*')
	// if (error) {
	// 	console.log('ERROR:', error)
	// 	console.log('ERROR DATA:', data)
	// } else {
	// 	console.log('NO ERROR:', data)
	// }
	// i need to make the Change items contain all of the row's data. All data needs to be passed through the upsert
}
