import { AccountManager } from './AccountManager/AccountManager'
import { insertAccount } from './insertAccount'
import { createClient } from '@/utils/supabase/server'
import s from './page.module.scss'

export default async function Accounts() {
	return (
		<div className={s.main}>
			<AccountManager />
		</div>
	)
}
