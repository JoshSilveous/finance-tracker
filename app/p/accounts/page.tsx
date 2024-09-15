import { AccountManager } from './AccountManager/AccountManager'
import s from './page.module.scss'

export default async function Accounts() {
	return (
		<div className={s.main}>
			<AccountManager />
		</div>
	)
}
