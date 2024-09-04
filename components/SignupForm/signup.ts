'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(email: string, password: string) {
	const supabase = createClient()

	const { error } = await supabase.auth.signUp({ email: email, password: password })

	if (error) {
		return { error: error.message }
	} else {
		revalidatePath('/', 'layout')
		redirect('/')
	}
}