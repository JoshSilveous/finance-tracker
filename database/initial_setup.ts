'use client'
import { PostgrestError } from '@supabase/supabase-js'
import { createClient } from './supabase/client'

const supabase = createClient()

interface TutorialProgress {
	completed: boolean
}
export async function fetchInitSetupProgress() {
	const { data, error } = await supabase.from('setup_is_complete').select('completed')

	console.log('res:', data ? data[0] : 'null')
	if (error) {
		throw new Error(error.message)
	}
	return data[0] as TutorialProgress
}
export async function setInitSetupProgress(completed: boolean) {
	interface Result extends TutorialProgress {
		id: string
		user_id: string
	}
	const { data, error: fetchError } = (await supabase
		.from('setup_is_complete')
		.select('id, user_id, completed')) as {
		data: Result[]
		error: PostgrestError | null
	}
	if (fetchError) {
		throw new Error(fetchError.message)
	}

	const newData = { ...data[0], completed }

	const { error: updateError } = await supabase
		.from('setup_is_complete')
		.upsert([newData], {
			defaultToNull: false,
			onConflict: 'id',
			ignoreDuplicates: false,
		})
	if (updateError) {
		throw new Error(updateError.message)
	}

	return
}
