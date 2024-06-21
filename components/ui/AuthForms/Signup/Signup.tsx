'use client'

import style from './Signup.module.scss'
import React from 'react'
import Link from 'next/link'
import { signUp } from '@/utils/auth-helpers/server'
import { handleRequest } from '@/utils/auth-helpers/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { JInput } from '../../FormElements'
import { JButton } from '../../FormElements/JButton/JButton'

// Define prop type with allowEmail boolean
interface SignUpProps {
	allowEmail: boolean
	redirectMethod: string
}

export function SignUp({ allowEmail, redirectMethod }: SignUpProps) {
	const router = redirectMethod === 'client' ? useRouter() : null
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true) // Disable the button while the request is being handled
		await handleRequest(e, signUp, router)
		setIsSubmitting(false)
	}

	return (
		<div className={style.container}>
			<form noValidate={true} onSubmit={(e) => handleSubmit(e)}>
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
						<label htmlFor='password'>Password</label>
						<JInput
							className={style.password_input}
							id='password'
							placeholder='Password'
							type='password'
							name='password'
							autoComplete='current-password'
						/>
					</div>
					<JButton
						text='Sign up'
						className={style.sign_in_button}
						accent='primary'
						type='submit'
						isLoading={isSubmitting}
					/>
				</div>
			</form>
			<div className={style.links_container}>
				<p>
					<strong>Already have an account?</strong>
				</p>

				<p>
					<Link href='/signin/password_signin' className='font-light text-sm'>
						Sign in with email and password
					</Link>
				</p>
				{allowEmail && (
					<p>
						<Link href='/signin/email_signin' className='font-light text-sm'>
							Sign in via magic link
						</Link>
					</p>
				)}
			</div>
		</div>
	)
}
