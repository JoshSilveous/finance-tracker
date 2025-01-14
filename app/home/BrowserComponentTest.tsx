'use client'
import { createClient as createClientOnBrowser } from '@/database/supabase/client'

export function BrowserComponentTest() {
	const browserSupabase = createClientOnBrowser()
	browserSupabase.auth.getUser().then((data) => {
		console.log('client:', data)
	})

	return <div></div>
}
