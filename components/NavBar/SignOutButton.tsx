'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirectToError } from '@/utils/redirectToError'

export function SignOutButton() {
	async function signOut() {
		const supabase = createClient()
		const { error } = await supabase.auth.signOut()
		if (error) {
			redirectToError(error.message)
		} else {
			redirectToError('just kidding, success!')
		}
	}

	return <button onClick={signOut}>Sign Out</button>
}
