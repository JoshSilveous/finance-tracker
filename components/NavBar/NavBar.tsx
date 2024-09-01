import { SignOutButton } from './SignOutButton'
import s from './NavBar.module.scss'

export default function NavBar() {
	return (
		<div className={s.container}>
			<div className={s.navigation_links}>
				<div className={s.link_container}>Log</div>
				<div className={s.link_container}>Categories</div>
				<div className={s.link_container}>Accounts</div>
			</div>
			<div className={s.sign_out_container}>
				<SignOutButton />
			</div>
		</div>
	)
}
