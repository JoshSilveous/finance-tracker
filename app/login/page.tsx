'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import s from './page.module.scss'
import { LoginForm } from '@/app/login/LoginForm/LoginForm'
import { SignupForm } from '@/app/login/SignupForm/SignupForm'
import { default as LoadingAnim } from '@/public/loading.svg'
import { JButton } from '@/components/JForm'
import { GithubButton } from './GithubButton/GithubButton'
import { SignInAnonymouslyButton } from './SignInAnonymouslyButton/SignInAnonymouslyButton'

type FormType = 'login' | 'signup'
export default function LoginPage() {
	const [formLoading, setFormLoading] = useState(true)
	const loginContainerRef = useRef<HTMLDivElement>(null)
	const signupContainerRef = useRef<HTMLDivElement>(null)
	const [currentForm, setCurrentForm] = useState<FormType>('login')
	const router = useRouter()

	useEffect(() => {
		if (window.location.hash === '#signup') {
			setCurrentForm('signup')
		}
		setFormLoading(false)
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
			{formLoading ? (
				<div>
					<LoadingAnim />
				</div>
			) : currentForm === 'login' ? (
				<div className={s.login_container} ref={loginContainerRef}>
					<h1>Sign in to your account</h1>
					<LoginForm />
					<div className={s.toggle_container}>
						<span>Don&apos;t have an account?</span>{' '}
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
			<div className={s.separator}>or</div>
			<GithubButton className={s.github_button} />
			<SignInAnonymouslyButton text='Sign In with Temporary Account *' />
			<p className={s.anonymous_text}>
				* Creates an <strong>anonymous</strong> profile in the database, providing
				access to all features without entering any personal information. This allows
				you to &quot;demo&quot; the project, and your anonymous profile{' '}
				<strong>will disappear when your browser&apos;s cache is cleared</strong>.
			</p>
		</div>
	)
}
