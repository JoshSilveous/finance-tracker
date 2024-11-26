'use client'

import { createClient, getUserID } from '@/utils/supabase/client'

const supabase = createClient()

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
