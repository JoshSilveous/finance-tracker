'use client'

import style from './UpdatePassword.module.scss'
import { updatePassword } from '@/utils/auth-helpers/server'
import { handleRequest } from '@/utils/auth-helpers/client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { JInput } from '../../FormElements'
import { JButton } from '../../FormElements/JButton/JButton'

interface UpdatePasswordProps {
	redirectMethod: string
}

export function UpdatePassword({ redirectMethod }: UpdatePasswordProps) {
	const router = redirectMethod === 'client' ? useRouter() : null
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true) // Disable the button while the request is being handled
		await handleRequest(e, updatePassword, router)
		setIsSubmitting(false)
	}

	return (
		<div className={style.container}>
			<form noValidate={true} className='mb-4' onSubmit={(e) => handleSubmit(e)}>
				<div className={style.credentials_container}>
					<div className={style.credentials_form}>
						<label htmlFor='password'>New Password</label>
						<JInput
							className={style.password_input}
							id='password'
							placeholder='Password'
							type='password'
							name='password'
							autoComplete='current-password'
						/>
						<label htmlFor='passwordConfirm'>Confirm New Password</label>
						<input
							id='passwordConfirm'
							placeholder='Password'
							type='password'
							name='passwordConfirm'
							autoComplete='current-password'
							className='w-full p-3 rounded-md bg-zinc-800'
						/>
						<JInput
							className={style.first_input}
							id='passwordConfirm'
							placeholder='Password'
							type='password'
							name='passwordConfirm'
							autoComplete='current-password'
						/>
					</div>
					<JButton
						text='Update Password'
						className={style.sign_in_button}
						accent='primary'
						type='submit'
						isLoading={isSubmitting}
					/>
				</div>
			</form>
		</div>
	)
}
