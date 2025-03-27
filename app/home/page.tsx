import { redirect } from 'next/navigation'
import s from './page.module.scss'
import { createClient } from '@/database/supabase/server'
import { default as LBLogo } from '@/public/lb_logo.svg'
import Image from 'next/image'
import Link from 'next/link'
import { DemoButton } from './DemoButton/DemoButton'

export default async function Home() {
	const supabase = createClient()
	const { data, error } = await supabase.auth.getUser()
	const userAlreadyLoggedIn = !(error || !data?.user)

	return (
		<div className={s.page_container}>
			{/* contains all content, overflows */}
			<div className={s.top_bar}>
				<div className={s.top_bar_inner}>
					<div className={s.logo}>
						<LBLogo />
						<p>LedgerBoard</p>
					</div>
					<div className={s.top_bar_actions}>
						{userAlreadyLoggedIn ? (
							<Link href='/p/dashboard'>Dashboard</Link>
						) : (
							<Link href='/login'>Login</Link>
						)}
					</div>
				</div>
			</div>
			<div className={s.content_container}>
				{/*  restricts content width*/}
				<div className={s.tagline}>
					<h1>Your finances. Your way.</h1>
					<p className={s.text}>
						A manual-first finance app for clarity, control, and customization.
					</p>
					<div className={s.tagline_actions}>
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
				<div className={s.image_container}>
					<Image
						src='/images/landing_1.png'
						width={1920}
						height={1080}
						alt='REPLACEME'
					/>
				</div>
				<div className={s.more_details}>
					<div className={s.detail}>
						<p className={s.bold}>Manual-first. Meaningful always.</p>
						<p className={s.reg}>
							Log transactions, categorize your way, and track spending with
							full control and intent.
						</p>
					</div>
					<div className={s.detail}>
						<p className={s.bold}>Built for customization.</p>
						<p className={s.reg}>
							Create a personalized dashboard to match your unique budgeting
							and financial tracking style.
						</p>
					</div>
					<div className={s.detail}>
						<p className={s.bold}>No ads. No gimmicks. Just clarity.</p>
						<p className={s.reg}>
							No tracking, ads, or upsells—just a clear, distraction-free view
							of your finances.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
