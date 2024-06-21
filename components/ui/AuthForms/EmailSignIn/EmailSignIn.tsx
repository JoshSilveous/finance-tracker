'use client'

import style from './EmailSignIn.module.scss'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { signInWithEmail } from '@/utils/auth-helpers/server'
import { handleRequest } from '@/utils/auth-helpers/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { JInput } from '../../FormElements'
import { JButton } from '../../FormElements/JButton/JButton'

// Define prop type with allowPassword boolean
interface EmailSignInProps {
	allowPassword: boolean
	redirectMethod: string
	disableButton?: boolean
}

export function EmailSignIn({ allowPassword, redirectMethod, disableButton }: EmailSignInProps) {
	const router = redirectMethod === 'client' ? useRouter() : null
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true) // Disable the button while the request is being handled
		await handleRequest(e, signInWithEmail, router)
		setIsSubmitting(false)
	}

	return (
		<div className={style.container}>
			<form noValidate={true} className='mb-4' onSubmit={(e) => handleSubmit(e)}>
				<div className={style.credentials_container}>
					<div className={style.credentials_form}>
						<label htmlFor='email'>Email</label>
						<JInput
							className={style.email_input}
							id='email'
							placeholder='name@example.com'
							type='email'
							name='email'
							autoCapitalize='none'
							autoComplete='email'
							autoCorrect='off'
						/>
					</div>
					<JButton
						text='Sign in'
						className={style.sign_in_button}
						accent='primary'
						type='submit'
						isLoading={isSubmitting}
					/>
				</div>
			</form>
			{allowPassword && (
				<div className={style.links_container}>
					<p>
						<Link href='/signin/password_signin' className='font-light text-sm'>
							Sign in with email and password
						</Link>
					</p>
					<p>
						<Link href='/signin/signup' className='font-light text-sm'>
							Don't have an account? Sign up
						</Link>
					</p>
				</div>
			)}
		</div>
	)
}
