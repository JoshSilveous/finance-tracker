import { insertAccount } from './insertAccount'
import { createClient } from '@/utils/supabase/server'

export default async function Accounts() {
	const supabase = createClient()
	const { data, error } = await supabase.from('accounts').select('*')

	if (error) {
		console.log('error loading accounts', error)
	}
	return (
		<div>
			Accounts!
			<form style={{ maxWidth: '400px' }}>
				<input type='text' id='name' name='name' />
				<input type='number' id='starting_amount' name='starting_amount' />
				<button type='submit' formAction={insertAccount}>
					Submit
				</button>
			</form>
			{data?.map((item) => (
				<div>{JSON.stringify(item)}</div>
			))}
		</div>
	)
}
