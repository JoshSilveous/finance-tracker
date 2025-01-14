'use client'
import { JButton } from '@/components/JForm'
import { createClient } from '@/database/supabase/client'
import { default as GitHubLogo } from '@/public/github_logo.svg'
import { useState } from 'react'

const supabase = createClient()

export function GithubButton({ context }: { context: 'sign_in' | 'sign_up' }) {
	const [loading, setLoading] = useState(false)
	const handleGithubSignIn = async () => {
		setLoading(true)
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		})
		if (error) {
			console.error('Error signing in:', error.message)
		}
	}
	return (
		<JButton jstyle='secondary' onClick={handleGithubSignIn} loading={loading}>
			<GitHubLogo />
			{context === 'sign_in' ? 'Sign in with GitHub' : 'Sign up with GitHub'}
		</JButton>
	)
}
