'use client'

import { createClient, getUserID } from '@/utils/supabase/client'

const supabase = createClient()

export async function fetchData() {
	const { data, error } = await supabase
		.from('accounts')
		.select('id, name, order_position, starting_amount')
		.order('order_position')
	if (error) {
		throw new Error(error.message)
	}
	return data as Account.WithPropsAndID[]
}

interface AccountManagerPreferences {
	account_name_width: number
	starting_amount_width: number
}
export async function fetchPreferredColumnWidths() {
	const { data, error } = await supabase
		.from('preferences')
		.select(
			'account_name_width:AccountManager_account_name_column_width, starting_amount_width:AccountManager_starting_amount_column_width'
		)
	if (error) {
		throw new Error(error.message)
	}
	if (data.length === 0) {
		throw new Error('Preferences not found!')
	}
	const preferences: unknown = data[0]
	return preferences as AccountManagerPreferences
}

export async function updatePreferredColumnWidth(columnIndex: number, newWidth: number) {
	let columnName: string
	switch (columnIndex) {
		case 0:
			columnName = 'AccountManager_account_name_column_width'
			break
		case 1:
			columnName = 'AccountManager_starting_amount_column_width'
			break
		default:
			throw new Error(`columnIndex "${columnIndex}" is not valid.`)
	}
	const user_id = await getUserID()

	const { error } = await supabase
		.from('preferences')
		.update({ [columnName]: newWidth })
		.eq('user_id', user_id)
	if (error) {
		throw new Error(error.message)
	}
	return
}

export async function upsertData(accountUpdates: Account.WithPropsAndID[]) {
	const user_id = await getUserID()

	const accountUpdatesWithUserID: Account.WithPropsAndID[] = accountUpdates.map((item) => {
		return {
			...item,
			user_id: user_id,
		}
	})

	const { error } = await supabase.from('accounts').upsert(accountUpdatesWithUserID, {
		defaultToNull: false,
		onConflict: 'id',
		ignoreDuplicates: false,
	})
	if (error) {
		throw new Error(error.message)
	}

	return
}

export async function insertAccount(account: Account.Bare) {
	const user_id = await getUserID()

	const numOfAccounts = await getAccountsCount()

	const newAccount: Account.WithPropsAndUser = {
		name: account.name,
		starting_amount: account.starting_amount,
		user_id: user_id,
		order_position: numOfAccounts!,
	}

	const { error } = await supabase.from('accounts').insert([newAccount])

	if (error) {
		throw new Error(error.message)
	}
	return
}

export async function getAccountsCount() {
	const { count, error } = await supabase
		.from('accounts')
		.select('*', { count: 'exact', head: true })
	if (error) {
		throw new Error(error.message)
	}
	return count as number
}

export async function getAssociatedTransactionCount(account_id: Account.ID) {
	const { count, error } = await supabase
		.from('transactions')
		.select('*', { count: 'exact', head: true })
		.eq('account_id', account_id)
	if (error) {
		throw new Error(error.message)
	}
	return count as number
}

export async function deleteAccountAndTransactions(account_id: Account.ID) {
	const transactionsUpdate = await supabase
		.from('transactions')
		.delete()
		.eq('account_id', account_id)

	if (transactionsUpdate.error) {
		throw new Error(transactionsUpdate.error.message)
	}

	const accountDeleteRes = await supabase.from('accounts').delete().eq('id', account_id)
	if (accountDeleteRes.error) {
		throw new Error(accountDeleteRes.error.message)
	}
}
export async function deleteAccountAndSetNull(account_id: Account.ID) {
	// by default, transactions account_id are set null when associated account is
	const res = await supabase.from('accounts').delete().eq('id', account_id)

	if (res.error) {
		throw new Error(res.error.message)
	}
}
export async function deleteAccountAndReplace(
	account_id: Account.ID,
	new_account_id: Account.ID
) {
	const transactionsUpdate = await supabase
		.from('transactions')
		.update({ account_id: new_account_id })
		.eq('account_id', account_id)

	if (transactionsUpdate.error) {
		throw new Error(transactionsUpdate.error.message)
	}

	const accountDeleteRes = await supabase.from('accounts').delete().eq('id', account_id)

	if (accountDeleteRes.error) {
		throw new Error(accountDeleteRes.error.message)
	}
}
