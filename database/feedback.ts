'use client'
import { createClient, getUserID } from '@/database/supabase/client'
const supabase = createClient()

export async function submitFeedback(feedback: string, source: string) {
	const user_id = await getUserID()

	const { error } = await supabase.from('feedback').insert([{ user_id, feedback, source }])

	if (error) {
		throw new Error(error.message)
	}
	return
}
