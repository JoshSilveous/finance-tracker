import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import s from './page.module.scss'
import { fetchDataTest } from './clientFunctions'

export default async function Home() {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	if (error || !data?.user) {
		redirect('/login')
	}

	return (
		<div className={s.container}>
			<p>Hello {data.user.email}</p>
			<button onClick={fetchDataTest}>Test query</button>
		</div>
	)
}
