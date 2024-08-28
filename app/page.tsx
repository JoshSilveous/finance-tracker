import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export default async function Home() {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	if (error || !data?.user) {
		console.log('redirecting to home')
		redirect('/home')
	} else {
		console.log('redirecting to private home')
		redirect('/p/home')
	}
}
