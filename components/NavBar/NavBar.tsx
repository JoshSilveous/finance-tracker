import { SignOutButton } from './SignOutButton'
import s from './NavBar.module.scss'
import { NavLinks } from './NavLinks/NavLinks'

export default async function NavBar() {
	return (
		<div className={s.container}>
			<NavLinks />
			<div className={s.sign_out_container}>
				<SignOutButton />
			</div>
		</div>
	)
}
