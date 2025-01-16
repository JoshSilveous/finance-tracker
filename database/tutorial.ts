'use client'
import { PostgrestError } from '@supabase/supabase-js'
import { createClient } from './supabase/client'
import { getUserID } from './supabase/server'

const supabase = createClient()

interface TutorialProgress {
	stage: number
	completed: boolean
}
export async function fetchTutorialProgress() {
	const { data, error } = await supabase
		.from('tutorial_progress')
		.select('completed, stage')

	if (error) {
		throw new Error(error.message)
	}
	return data[0] as TutorialProgress
}
export async function setTutorialProgress(stage: number, completed: boolean) {
	interface Result extends TutorialProgress {
		id: string
		user_id: string
	}
	const { data, error: fetchError } = (await supabase
		.from('tutorial_progress')
		.select('id, user_id, stage, completed')) as {
		data: Result[]
		error: PostgrestError | null
	}
	if (fetchError) {
		throw new Error(fetchError.message)
	}

	const newData = { ...data[0], stage, completed }

	const { error: updateError } = await supabase
		.from('tutorial_progress')
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
