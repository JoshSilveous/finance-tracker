import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function Home() {
	return (
		<p>
			Home!
			<Link href='/login'>Login</Link>
			<Link href='/private'>Private</Link>
		</p>
	)
}
