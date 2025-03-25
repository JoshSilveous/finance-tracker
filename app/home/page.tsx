import { redirect } from 'next/navigation'
import s from './page.module.scss'
import { createClient } from '@/database/supabase/server'

import Link from 'next/link'
import { DemoButton } from './DemoButton/DemoButton'

export default async function Home() {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	const userAlreadyLoggedIn = !(error || !data?.user)

	return (
		<div className={s.main}>
			<div className={s.content_container}>
				<div className={s.content}>
					<div className={s.first_tagline_container}>
						<h1>Your finances. Your way.</h1>
						<p>
							A manual-first finance app for clarity, control, and
							customization.
						</p>
						<div className={s.action_container}>
							{userAlreadyLoggedIn ? (
								<Link href='/p/dashboard'>Go to Dashboard</Link>
							) : (
								<>
									<Link href='/login'>Login Page</Link>
									<DemoButton className={s.demo_button} />
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
