'use client'

import style from './OauthSignIn.module.scss'
import { default as GitHubIcon } from '@/public/github.svg'
import { signInWithOAuth } from '@/utils/auth-helpers/client'
import { type Provider } from '@supabase/supabase-js'
import { useState } from 'react'
import { JButton } from '../../FormElements/JButton/JButton'

type OAuthProviders = {
	name: Provider
	displayName: string
	icon: JSX.Element
}

export function OauthSignIn() {
	const oAuthProviders: OAuthProviders[] = [
		{
			name: 'github',
			displayName: 'GitHub',
			icon: <GitHubIcon />,
		},
		/* Add desired OAuth providers here */
	]
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true) // Disable the button while the request is being handled
		await signInWithOAuth(e)
		setIsSubmitting(false)
	}

	return (
		<div className={style.main}>
			{oAuthProviders.map((provider) => (
				<form key={provider.name} onSubmit={(e) => handleSubmit(e)}>
					<input type='hidden' name='provider' value={provider.name} />
					<JButton
						icon={provider.icon}
						text={provider.displayName}
						isLoading={isSubmitting}
					/>
				</form>
			))}
		</div>
	)
}
