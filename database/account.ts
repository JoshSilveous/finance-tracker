'use client'
import { createClient, getUserID } from '@/database/supabase/client'
const supabase = createClient()

export interface FetchedAccount {
	id: string
	name: string
	order_position: number
	starting_amount: number
}
export async function fetchAccountData() {
	const { data, error } = await supabase
		.from('accounts')
		.select('id, name, order_position, starting_amount')
		.order('order_position')

	if (error) {
		throw new Error(error.message)
	}
	return data as FetchedAccount[]
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

export interface InsertAccountEntry {
	name: string
	starting_amount: number
}
export async function insertAccount(account: InsertAccountEntry) {
	const user_id = await getUserID()

	const numOfAccounts = await getAccountsCount()

	const newAccount = {
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

export interface UpsertAccountEntry {
	id: string
	name: string
	starting_amount: number
	order_position: number
}
export async function upsertAccounts(accountUpdates: UpsertAccountEntry[]) {
	const user_id = await getUserID()

	const accountUpdatesWithUserID = accountUpdates.map((item) => {
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

export async function getAccountCountAssocWithTransaction(account_id: string) {
	const { count, error } = await supabase
		.from('transactions')
		.select('*', { count: 'exact', head: true })
		.eq('account_id', account_id)
	if (error) {
		throw new Error(error.message)
	}
	return count as number
}
export async function deleteAccountAndTransactions(account_id: string) {
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
export async function deleteAccountAndSetNull(account_id: string) {
	// by default, transactions account_id are set null when associated account is
	const res = await supabase.from('accounts').delete().eq('id', account_id)

	if (res.error) {
		throw new Error(res.error.message)
	}
}
export async function deleteAccountAndReplace(account_id: string, new_account_id: string) {
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

export interface AccountTotal {
	account_id: string
	total_amount: number
}
export async function fetchAccountTotals() {
	const { data, error } = await supabase.rpc('get_totals_by_account')
	if (error) {
		throw new Error(error.message)
	}
	return data as AccountTotal[]
}

/**
 * Within those two dates INCLUDING startDate and endDate
 * @param startDate
 * @param endDate
 * @returns
 */
export async function fetchAccountTotalsWithinDateRange(startDate: string, endDate: string) {
	const { data, error } = (await supabase.rpc('get_totals_by_account_within_dates', {
		start_date: startDate,
		end_date: endDate,
	})) as {
		data: AccountTotal[]
		error: any
	}

	if (error) {
		throw new Error(error.message)
	}

	return data.map((item) =>
		item.account_id === null ? { account_id: '', total_amount: item.total_amount } : item
	) as AccountTotal[]
}
