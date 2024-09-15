'use client'
import { clientCreateClient } from '@/utils'
import { useRouter } from 'next/navigation'
import { JButton } from '../JForm'

export function SignOutButton() {
	const router = useRouter()
	async function signOut() {
		const supabase = clientCreateClient()
		const { error } = await supabase.auth.signOut()
		if (error) {
			router.push(`/error?message=${encodeURIComponent(error.message)}`)
		} else {
			router.push(`/home`)
			// later on, have this create a popup that says "you have signed out" and an option to login / return to home
		}
	}

	return (
		<JButton jstyle='secondary' onClick={signOut}>
			Sign Out
		</JButton>
	)
}
