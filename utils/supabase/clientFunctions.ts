'use client'
import { createClient } from '@/utils/supabase/client'

export async function getUserID() {
	const supabase = createClient()
	const { data, error } = await supabase.auth.getUser()
	if (error) {
		throw new Error(error.message)
	}
	return data.user.id
}
