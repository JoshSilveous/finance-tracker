import { SignOutButton } from './SignOutButton'
import { createClient } from '@/utils/supabase/server'
import s from './NavBar.module.scss'
import { NavLinks } from './NavLinks/NavLinks'

export default async function NavBar() {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	return (
		<div className={s.container}>
			<NavLinks />
			<div className={s.sign_out_container}>
				<SignOutButton />
			</div>
		</div>
	)
}
