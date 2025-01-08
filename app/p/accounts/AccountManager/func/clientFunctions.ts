'use client'

import { createClient, getUserID } from '@/database/supabase/client'
import { getNumPref, setNumPref } from '@/utils'

const supabase = createClient()

interface AccountManagerPreferences {
	account_name_width: number
	starting_amount_width: number
}
export async function fetchPreferredColumnWidths() {
	return {
		account_name_width: getNumPref('AccountManager_account_name_column_width', 150),
		starting_amount_width: getNumPref(
			'AccountManager_starting_amount_column_width',
			200
		),
	} as AccountManagerPreferences
}

export async function updatePreferredColumnWidth(columnIndex: number, newWidth: number) {
	switch (columnIndex) {
		case 0:
			setNumPref('AccountManager_account_name_column_width', newWidth)
			break
		case 1:
			setNumPref('AccountManager_starting_amount_column_width', newWidth)
			break
		default:
			throw new Error(`columnIndex "${columnIndex}" is not valid.`)
	}
	return
}
