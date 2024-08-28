'use client'
import { useState } from 'react'
import { login, signup } from './actions'

export default function LoginPage() {
	const [error, setError] = useState('')
	async function loginHandler(formData: FormData) {
		try {
			login(formData)
			setError('')
		} catch (err: any) {
			setError(err)
		}
	}
	function signupHandler() {}
	return (
		<form>
			<label htmlFor='email'>Email:</label>
			<input id='email' name='email' type='email' required />
			<label htmlFor='password'>Password:</label>
			<input id='password' name='password' type='password' required />
			<button formAction={loginHandler}>Log in</button>
			<button formAction={signup}>Sign up</button>
			{error && <div>{error}</div>}
		</form>
	)
}
