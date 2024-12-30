'use server'
import { createClient, getUserID } from './server'

export async function createPreferencesEntry() {
	const supabase = createClient()
	const user_id = await getUserID()

	// check to make sure entry doesn't already exist
	const checkRes = await supabase
		.from('preferences')
		.select('user_id')
		.eq('user_id', user_id)
	if (checkRes.error) {
		throw new Error(checkRes.error.message)
	}
	if (checkRes.data.length !== 0) {
		throw new Error('Preferences entry already exists!')
	}

	// create new entry
	const { error } = await supabase.from('preferences').insert([{ user_id: user_id }])
	if (error) {
		throw new Error(error.message)
	}
	return
}
