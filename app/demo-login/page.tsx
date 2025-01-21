import { SignInAnonymouslyButton } from '../login/SignInAnonymouslyButton/SignInAnonymouslyButton'
import s from './page.module.scss'

export default function DemoLoginPage() {
	return (
		<div className={s.main}>
			<div className={s.content}>
				<h2>Welcome!</h2>
				<p>
					Thank you for checking out my Finance Tracker website! You can use the
					button below to create a <strong>Temporary Anonymous Account</strong>, if
					you just want to "demo" my project. Alternatively, you can go to the{' '}
					<a href='/login#signup'>Signup Page</a> to create a permanent account
					with <strong>GitHub</strong> or <strong>Email</strong>.
				</p>
				<div className={s.button_container}>
					<SignInAnonymouslyButton text='Sign In with Temporary Account' />
				</div>
			</div>
		</div>
	)
}
