import { createClient } from '@/utils/supabase/server'
import style from './Navbar.module.scss'
import Navlinks from './Navlinks/Navlinks'

export default async function Navbar() {
	const supabase = createClient()

	const {
		data: { user },
	} = await supabase.auth.getUser()

	return (
		<nav>
			<div className={style.main}>
				<Navlinks user={user} />
			</div>
		</nav>
	)
}
