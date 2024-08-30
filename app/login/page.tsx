'use client'
import { useState } from 'react'
import { login, signup } from './actions'
import s from './page.module.scss'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
	return (
		<div className={s.container}>
			<h1>Sign in to your account</h1>
			<LoginForm />
		</div>
	)
}
