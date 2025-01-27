'use client'
import { createClient, getUserID } from '@/database/supabase/client'
import { PostgrestError } from '@supabase/supabase-js'
const supabase = createClient()
export interface FetchedTransaction {
	id: string
	date: string
	name: string
	order_position: number
	items: {
		id: string
		account_id: string | null
		category_id: string | null
		name: string
		amount: number
		order_position: number
	}[]
}
export async function fetchTransactionData(startingDate: string) {
	const { data, error } = (await supabase.rpc('get_transactions_with_items', {
		starting_date: startingDate,
	})) as {
		data: FetchedTransaction[]
		error: PostgrestError | null
	}

	if (error) {
		throw new Error(error.message)
	}

	// this should realistically never happen outside of dev, but just in case
	const filteredData = data.filter((transaction) => transaction.items !== null)
	return filteredData
}

export async function getTransactionsCount(date?: string) {
	const { count, error } =
		date === undefined
			? await supabase.from('transactions').select('*', { count: 'exact', head: true })
			: await supabase
					.from('transactions')
					.select('*', { count: 'exact', head: true })
					.eq('date', date)

	if (error) {
		throw new Error(error.message)
	}
	return count as number
}

export interface InsertTransactionEntry {
	name: string
	date: string
	items: {
		name: string
		amount: string
		category_id: string
		account_id: string
	}[]
}
export async function insertTransactionAndItems(transaction: InsertTransactionEntry) {
	if (transaction.name.trim() === '') {
		throw new Error('Transaction Name cannot be empty!')
	} else if (transaction.date.trim() === '') {
		throw new Error('Transaction Date cannot be empty!')
	} else if (transaction.items.length === 0) {
		throw new Error('Transaction must have at least one item!')
	} else if (transaction.items.length === 1) {
		if (transaction.items[0].amount.trim() === '') {
			throw new Error(`Item amount cannot be empty!`)
		}
	} else if (transaction.items.length > 1) {
		transaction.items.forEach((item, index) => {
			if (item.name.trim() === '') {
				throw new Error(`Item #${index}'s name cannot be empty!`)
			}
			if (item.amount.trim() === '') {
				throw new Error(`Item #${index}'s amount cannot be empty!`)
			}
		})
	}
	const user_id = await getUserID()

	// get # of transactions already (for this date) to determine order_position
	const count = await getTransactionsCount()

	const newPackagedTransaction = {
		date: transaction.date,
		name: transaction.name,
		user_id: user_id,
		order_position: count,
	}

	const { data: transactionData, error: transactionError } = await supabase
		.from('transactions')
		.insert([newPackagedTransaction])
		.select('id')

	if (transactionError) {
		throw new Error(transactionError.message)
	}

	const newTransactionID = transactionData[0].id

	const newPackagedItems = transaction.items.map((item, index) => {
		return {
			name: item.name.trim() === '' ? null : item.name,
			amount: Number(item.amount),
			category_id: item.category_id === '' ? null : item.category_id,
			account_id: item.account_id === '' ? null : item.account_id,
			transaction_id: newTransactionID,
			user_id: user_id,
			order_position: index,
		}
	})

	const { data: itemData, error: itemError } = await supabase
		.from('transaction_items')
		.insert(newPackagedItems)
		.select('id')

	if (itemError) {
		throw new Error(itemError.message)
	}

	return
}

export interface UpsertTransactionEntry {
	id: string
	name: string
	date: string
	order_position?: number
}
export interface UpsertItemEntry {
	id: string
	name: string | null
	amount: string
	category_id: string | null
	account_id: string | null
	order_position?: number
	transaction_id: string
}
export async function upsertTransactionsAndItems(
	transactions: UpsertTransactionEntry[],
	items: UpsertItemEntry[]
) {
	const user_id = await getUserID()

	const transactionUpdatesFormatted = transactions.map((trn) => {
		return {
			...trn,
			id: trn.id.split('||')[0] === 'PENDING_CREATION' ? undefined : trn.id,
			user_id: user_id,
		}
	})

	const newIDMap: { [pendingId: string]: string } = {}

	const { data, error: transactionError } = (await supabase
		.from('transactions')
		.upsert(transactionUpdatesFormatted, {
			defaultToNull: false,
			onConflict: 'id',
			ignoreDuplicates: false,
		})
		.select('id')) as { data: { id: string }[]; error: PostgrestError | null }
	console.log('transactions', transactions, '\ndata', data)
	if (transactionError) {
		console.error(transactionError)
		throw new Error(transactionError.message)
	}

	transactions.forEach((trn, index) => {
		if (trn.id.split('||')[0] === 'PENDING_CREATION') {
			newIDMap[trn.id] = data[index].id
		}
	})

	const itemUpdatesFormatted = items.map((item) => {
		return {
			...item,
			id: item.id.split('||')[0] === 'PENDING_CREATION' ? undefined : item.id,
			amount: Number(item.amount),
			transaction_id:
				item.transaction_id.split('||')[0] === 'PENDING_CREATION'
					? newIDMap[item.transaction_id]
					: item.transaction_id,
			category_id: item.category_id ? item.category_id : null,
			account_id: item.account_id ? item.account_id : null,
			user_id: user_id,
		}
	})
	console.log(
		'\ntransactions',
		transactions,
		'\ntransactionUpdatesFormatted',
		transactionUpdatesFormatted,
		'\nitemUpdatesFormatted',
		itemUpdatesFormatted,
		'\nitems',
		items
	)

	const { error: itemError } = await supabase
		.from('transaction_items')
		.upsert(itemUpdatesFormatted, {
			defaultToNull: false,
			onConflict: 'id',
			ignoreDuplicates: false,
		})

	if (itemError) {
		console.error(itemError)
		throw new Error(itemError.message)
	}

	return
}

export interface InsertItemEntry {
	name: string | null
	amount: string
	category_id: string | null
	account_id: string | null
	transaction_id: string
	order_position?: number
}
export async function insertItems(items: InsertItemEntry[]) {
	const user_id = await getUserID()

	const itemUpdatesWithUserID = items.map((item) => {
		return {
			...item,
			amount: Number(item.amount),
			user_id: user_id,
		}
	})

	const { data, error } = await supabase
		.from('transaction_items')
		.insert(itemUpdatesWithUserID)
	if (error) {
		throw new Error(error.message)
	}

	return data
}

export async function deleteItems(ids: string[]) {
	if (!ids.length) {
		return
	}

	const { error } = await supabase.from('transaction_items').delete().in('id', ids)

	if (error) {
		throw new Error(error.message)
	}

	return
}

export async function deleteTransactions(ids: string[]) {
	if (!ids.length) {
		return
	}

	const { error } = await supabase.from('transactions').delete().in('id', ids)

	if (error) {
		throw new Error(error.message)
	}

	return
}
