import { AccountManager } from './AccountManager/AccountManager'
import { insertAccount } from './insertAccount'
import { createClient } from '@/utils/supabase/server'
import s from './page.module.scss'

export default async function Accounts() {
	const supabase = createClient()
	const { data, error } = await supabase.from('accounts').select('*')

	if (error) {
		console.log('error loading accounts', error)
	}
	return (
		<div className={s.main}>
			<AccountManager />
		</div>
	)
}
