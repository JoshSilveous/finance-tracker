import { SignOutButton } from './SignOutButton'
import s from './NavBar.module.scss'
import { NavLinks } from './NavLinks/NavLinks'
import { createClient } from '@/database/supabase/server'

export default async function NavBar() {
	const supabase = createClient()
	const { data } = await supabase.auth.getUser()
	const greetingText = data.user?.is_anonymous ? (
		<>
			REMINDER: You are using a temporary account.
			<br />
			Sign out to create a permanent account.
		</>
	) : (
		<>Hello, {data.user?.user_metadata.name || data.user?.email}!</>
	)
	return (
		<div className={s.container}>
			<NavLinks />
			<div className={s.greeting}>{greetingText}</div>
			<div className={s.sign_out_container}>
				<SignOutButton />
			</div>
		</div>
	)
}
