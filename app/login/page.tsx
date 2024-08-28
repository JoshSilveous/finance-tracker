'use client'
import { useState } from 'react'
import { login, signup } from './actions'

export default function LoginPage() {
	const [error, setError] = useState('')
	async function loginHandler(formData: FormData) {
		const { errorMessage } = await login(formData)

		if (errorMessage) {
			setError(errorMessage)
			console.log('error!', errorMessage)
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
