'use client'
import { createClient, getUserID } from '@/database/supabase/client'
import { ErrorObject, errToObj } from '@/utils'
const supabase = createClient()

export async function submitFeedback(feedback: string, source: string) {
	const user_id = await getUserID()

	const { error } = await supabase.from('feedback').insert([{ user_id, feedback, source }])

	if (error) {
		throw new Error(error.message)
	}
	return
}

export async function reportErrorToDB(e: Error) {
	const errObj = errToObj(e)
	const user_id = await getUserID()
	const report = `
		ERROR OCCURRED AT "${new Date()}"

		--- JSON STRINGIFIED ERROR OBJECT ---
		${JSON.stringify(errObj)}
		--- JSON STRINGIFIED ERROR OBJECT ---
	`

	const { error } = await supabase
		.from('feedback')
		.insert([{ user_id, feedback: report, source: 'ERROR_REPORT' }])

	if (error) {
		console.error('Error reporting this error to database:', error.message)
	}
	return
}
