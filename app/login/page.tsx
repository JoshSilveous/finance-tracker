'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import s from './page.module.scss'
import { LoginForm } from '@/components/LoginForm/LoginForm'
import { SignupForm } from '@/components/SignupForm/SignupForm'

type FormType = 'login' | 'signup'
export default function LoginPage() {
	const [loading, setLoading] = useState(true)
	const loginContainerRef = useRef<HTMLDivElement>(null)
	const signupContainerRef = useRef<HTMLDivElement>(null)
	const [currentForm, setCurrentForm] = useState<FormType>('login')
	const router = useRouter()

	useEffect(() => {
		if (window.location.hash === '#signup') {
			setCurrentForm('signup')
		} else {
		}
		setLoading(false)
	}, [])

	function toggleForm() {
		if (currentForm === 'login') {
			setCurrentForm('signup')
			router.push('/login#signup')
		} else {
			setCurrentForm('login')
			router.push('/login')
		}
	}

	return (
		<div className={s.container}>
			{loading ? (
				<div>Loading...</div>
			) : currentForm === 'login' ? (
				<div className={s.login_container} ref={loginContainerRef}>
					<h1>Sign in to your account</h1>
					<LoginForm />
					<div className={s.toggle_container}>
						<span>Don't have an account?</span>{' '}
						<a onClick={toggleForm}>Create an account</a>
					</div>
				</div>
			) : (
				<div className={s.signup_container} ref={signupContainerRef}>
					<h1>Create an account</h1>
					<SignupForm />
					<div className={s.toggle_container}>
						<span>Already have an account?</span>{' '}
						<a onClick={toggleForm}>Sign in</a>
					</div>
				</div>
			)}
		</div>
	)
}
