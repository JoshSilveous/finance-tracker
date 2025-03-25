'use client'

import s from './DemoButton.module.scss'
import { useRouter } from 'next/navigation'
import { HTMLAttributes, useState } from 'react'
import { createClient } from '@/database/supabase/client'
import { JButton } from '@/components/JForm'

const supabase = createClient()

export function DemoButton(props: HTMLAttributes<HTMLButtonElement>) {
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
			<JButton jstyle='invisible' onClick={handleClick} loading={loading} {...props}>
				Try a Demo
			</JButton>
		</div>
	)
}
