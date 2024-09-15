import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)
}
export async function getUserID() {
	const supabase = createClient()
	const { data, error } = await supabase.auth.getUser()
	if (error) {
		throw new Error(error.message)
	}
	return data.user.id
}
