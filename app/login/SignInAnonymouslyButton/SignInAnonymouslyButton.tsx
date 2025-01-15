import { HTMLAttributes, useState } from 'react'
import s from './SignInAnonymouslyButton.module.scss'
import { createClient } from '@/database/supabase/client'
import { JButton } from '@/components/JForm'
import { useRouter } from 'next/navigation'
import { default as AnonymousLogo } from '@/public/anonymous.svg'

const supabase = createClient()

export function SignInAnonymouslyButton(props: HTMLAttributes<HTMLButtonElement>) {
	const [loading, setLoading] = useState(false)

	const router = useRouter()

	const handleClick = async () => {
		setLoading(true)
		const { error } = await supabase.auth.signInAnonymously()
		if (error) {
			console.error('Error signing in:', error.message)
			setLoading(false)
		}
		router.push('/p/dashboard')
	}
	return (
		<div className={s.main}>
			<JButton jstyle='secondary' onClick={handleClick} loading={loading} {...props}>
				<AnonymousLogo />
				Sign In with Temporary Account *
			</JButton>
			<p>
				* Creates an <strong>anonymous</strong> profile in the database, providing
				access to all features without entering any personal information. This allows
				you to "demo" the project, and your anonymous profile{' '}
				<strong>will disappear when your browser's cache is cleared</strong>.
			</p>
		</div>
	)
}
