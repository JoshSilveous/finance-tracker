import { redirect } from 'next/navigation'

import { createClient } from '@/database/supabase/server'

export default async function Home() {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	if (error || !data?.user) {
		redirect('/home')
	} else {
		redirect('/p/dashboard')
	}
}
