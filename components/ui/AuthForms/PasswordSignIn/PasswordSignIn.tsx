'use client'

import style from './PasswordSignIn.module.scss'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { signInWithPassword } from '@/utils/auth-helpers/server'
import { handleRequest } from '@/utils/auth-helpers/client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { JInput } from '../../FormElements'
import { JButton } from '../../FormElements/JButton/JButton'

// Define prop type with allowEmail boolean
interface PasswordSignInProps {
	allowEmail: boolean
	redirectMethod: string
}

export default function PasswordSignIn({ allowEmail, redirectMethod }: PasswordSignInProps) {
	const router = redirectMethod === 'client' ? useRouter() : null
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true) // Disable the button while the request is being handled
		await handleRequest(e, signInWithPassword, router)
		setIsSubmitting(false)
	}

	return (
		<div className={style.container}>
			<form noValidate={true} onSubmit={(e) => handleSubmit(e)}>
				<div className={style.credentials_container}>
					<div className={style.credentials_form}>
						<label htmlFor='email'>Email</label>
						<JInput
							id='email'
							placeholder='name@example.com'
							type='email'
							name='email'
							autoCapitalize='none'
							autoComplete='email'
							autoCorrect='off'
						/>
						<label htmlFor='password'>Password</label>
						<JInput
							id='password'
							placeholder='Password'
							type='password'
							name='password'
							autoComplete='current-password'
						/>
					</div>
					<JButton className={style.sign_in_button} accent='primary' type='submit'>
						Sign in
					</JButton>
				</div>
			</form>
			<p>
				<Link href='/signin/forgot_password'>Forgot your password?</Link>
			</p>
			{allowEmail && (
				<p>
					<Link href='/signin/email_signin'>Sign in via magic link</Link>
				</p>
			)}
			<p>
				<Link href='/signin/signup'>Don't have an account? Sign up</Link>
			</p>
		</div>
	)
}
