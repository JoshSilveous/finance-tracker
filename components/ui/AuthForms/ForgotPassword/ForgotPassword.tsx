'use client'

import style from './ForgotPassword.module.scss'
import Link from 'next/link'
import { requestPasswordUpdate } from '@/utils/auth-helpers/server'
import { handleRequest } from '@/utils/auth-helpers/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { JInput } from '../../FormElements'
import { JButton } from '../../FormElements/JButton/JButton'

// Define prop type with allowEmail boolean
interface ForgotPasswordProps {
	allowEmail: boolean
	redirectMethod: string
	disableButton?: boolean
}

export function ForgotPassword({ allowEmail, redirectMethod, disableButton }: ForgotPasswordProps) {
	const router = redirectMethod === 'client' ? useRouter() : null
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true) // Disable the button while the request is being handled
		await handleRequest(e, requestPasswordUpdate, router)
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
			<div className={style.links_container}>
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
				<p>
					<Link href='/signin/signup' className='font-light text-sm'>
						Don't have an account? Sign up
					</Link>
				</p>
			</div>
		</div>
	)
}
