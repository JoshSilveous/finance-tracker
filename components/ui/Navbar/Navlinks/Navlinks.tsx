'use client'

import Link from 'next/link'
import { SignOut } from '@/utils/auth-helpers/server'
import { handleRequest } from '@/utils/auth-helpers/client'
import { usePathname, useRouter } from 'next/navigation'
import { getRedirectMethod } from '@/utils/auth-helpers/settings'

import style from './Navlinks.module.scss'
import { MainLogo } from '@/components/svg/MainLogo'

interface NavlinksProps {
	user?: any
}

export default function Navlinks({ user }: NavlinksProps) {
	const router = getRedirectMethod() === 'client' ? useRouter() : null

	return (
		<div className={style.main}>
			<div className={style.main}>
				<Link href='/' aria-label='Logo'>
					<MainLogo />
				</Link>
				<nav>
					<Link href='/'>Pricing</Link>
					{user && <Link href='/account'>Account</Link>}
				</nav>
			</div>
			<div className={style.main}>
				{user ? (
					<form onSubmit={(e) => handleRequest(e, SignOut, router)}>
						<input type='hidden' name='pathName' value={usePathname()} />
						<button type='submit'>Sign out</button>
					</form>
				) : (
					<Link href='/signin'>Sign In</Link>
				)}
			</div>
		</div>
	)
}
