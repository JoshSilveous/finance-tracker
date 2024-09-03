'use server'

import { createClient } from '@/utils/supabase/server'

export async function insertAccount(formData: FormData) {
	const name = formData.get('name')
	const starting_amount = formData.get('starting_amount')

	console.log(name, starting_amount)

	const supabase = createClient()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()
	if (userError) {
		console.log('error getting user:', userError)
		return null
	}

	const { data, error } = await supabase
		.from('accounts')
		.insert([{ name: name, starting_amount: starting_amount, owner: user!.id }])

	if (error) {
		console.log('error with transaction:', error)
		return null
	} else {
		console.log('success!', data)
	}
}
