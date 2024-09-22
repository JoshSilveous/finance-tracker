import s from './DeleteForm.module.scss'

interface DeleteFormProps {
	account_name: string
	account_id: string
	afterDelete: () => void
}
export function DeleteForm({ account_name, account_id, afterDelete }: DeleteFormProps) {
	return (
		<div className={s.main}>
			<h1>Delete "{account_name}"</h1>
			<p>
				There are x transactions associated with this account. How would you like to
				handle those transactions?
			</p>
			<div>
				<input type='radio' id='huey' name='drone' value='huey' />
				<label htmlFor='huey'>Delete the transactions</label>
			</div>

			<div>
				<input type='radio' id='dewey' name='drone' value='dewey' />
				<label htmlFor='dewey'>
					Keep the transactions, and set their account attribute to Empty .
				</label>
			</div>

			<div>
				<input type='radio' id='louie' name='drone' value='louie' />
				<label htmlFor='louie'>
					Keep the transactions, and change their account attribute to a different
					account.
				</label>
			</div>
		</div>
	)
}
