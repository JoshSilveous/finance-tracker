'use client'
import { HTMLAttributes, useState } from 'react'
import s from './SignInAnonymouslyButton.module.scss'
import { createClient } from '@/database/supabase/client'
import { JButton } from '@/components/JForm'
import { useRouter } from 'next/navigation'
import { default as AnonymousLogo } from '@/public/anonymous.svg'

const supabase = createClient()

interface SignInAnonymouslyButtonProps extends HTMLAttributes<HTMLButtonElement> {
	text: string
}

export function SignInAnonymouslyButton(props: SignInAnonymouslyButtonProps) {
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
				{props.text}
			</JButton>
		</div>
	)
}
