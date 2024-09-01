'use client'
import { useState } from 'react'
import s from './NavLinks.module.scss'
import Link from 'next/link'

export function NavLinks() {
	const [curPage, setCurPage] = useState(window.location.pathname)
	return (
		<div className={s.container}>
			<div className={s.link_container}>
				<Link href='/p/log'>Log</Link>
			</div>
			<div className={s.link_container}>
				<Link href='/p/categories'>Categories</Link>
			</div>
			<div className={s.link_container}>
				<Link href='/p/accounts'>Accounts</Link>
			</div>
		</div>
	)
}
