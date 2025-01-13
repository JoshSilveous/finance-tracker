import { redirect } from 'next/navigation'
import { createClient } from '@/database/supabase/client'
import Link from 'next/link'

export default async function Home() {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	if (!(error || !data?.user)) {
		redirect('/p/dashboard')
	}

	return (
		<div>
			Hello! This is the home page, which you only view while unauthenticated. You are
			not signed in!
			<Link href='/login'>Login Page</Link>
		</div>
	)
}
