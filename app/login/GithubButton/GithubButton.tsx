'use client'
import { JButton } from '@/components/JForm'
import { createClient } from '@/database/supabase/client'
import { default as GitHubLogo } from '@/public/github_logo.svg'
import { HTMLAttributes, useState } from 'react'
import s from './GithubButton.module.scss'

const supabase = createClient()

export function GithubButton({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
	const [loading, setLoading] = useState(false)
	const handleClick = async () => {
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
		<JButton
			jstyle='secondary'
			onClick={handleClick}
			loading={loading}
			className={`${s.button} ${className ? className : ''}`}
			{...props}
		>
			<GitHubLogo />
			Sign in with GitHub
		</JButton>
	)
}
