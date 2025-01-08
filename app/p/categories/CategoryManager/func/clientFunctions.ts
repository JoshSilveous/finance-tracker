'use client'

import { createClient, getUserID } from '@/database/supabase/client'
import { getNumPref, setNumPref } from '@/utils'

const supabase = createClient()

interface CategoryManagerPreferences {
	category_name_width: number
}
export async function fetchPreferredColumnWidths() {
	return {
		category_name_width: getNumPref('CategoryManager_category_name_column_width', 230),
	} as CategoryManagerPreferences
}

export async function updatePreferredColumnWidth(columnIndex: number, newWidth: number) {
	switch (columnIndex) {
		case 1: {
			setNumPref('CategoryManager_category_name_column_width', newWidth)
			break
		}
	}
	return
}
