'use client'
import { createClient } from '@/utils/supabase/client'

export async function insertAccount(name: string, starting_amount: string) {
	const supabase = createClient()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError) {
		return { error: `User error: ${userError}` }
	}

	const { error } = await supabase
		.from('accounts')
		.insert([{ name: name, starting_amount: starting_amount, user_id: user!.id }])

	if (error) {
		return { error: `Data error: ${error}` }
	} else {
		return {}
	}
}
