import { redirect } from 'next/navigation'
import { serverCreateClient } from '@/utils'
import s from './page.module.scss'

export default async function Home() {
	const supabase = serverCreateClient()

	const { data, error } = await supabase.auth.getUser()
	if (error || !data?.user) {
		redirect('/login')
	}

	return (
		<div className={s.container}>
			<p>Hello {data.user.email}</p>
		</div>
	)
}
