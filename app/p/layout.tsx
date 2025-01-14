import NavBar from '@/components/NavBar/NavBar'
import s from './layout.module.scss'
import { createClient } from '@/database/supabase/server'
import { redirect } from 'next/navigation'
export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	if (error || !data?.user) {
		redirect('/home')
	}
	return (
		<div className={s.main}>
			<div className={s.navbar_container}>
				<NavBar />
			</div>
			<div className={s.content_container}>{children}</div>
		</div>
	)
}
