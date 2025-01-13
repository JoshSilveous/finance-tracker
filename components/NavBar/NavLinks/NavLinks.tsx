'use client'
import { useEffect, useRef } from 'react'
import s from './NavLinks.module.scss'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks() {
	const underlineRef = useRef<HTMLDivElement>(null)
	const linksRef = useRef<HTMLDivElement>(null)
	const pathname = usePathname()

	const navLinks = [{ title: 'Dashboard', href: '/p/dashboard' }]

	useEffect(() => {
		const linksElemArray = linksRef.current!.childNodes as NodeListOf<HTMLDivElement>
		const linkUnderlineElem = underlineRef.current!

		const currentPageIndex = navLinks.findIndex((item) => item.href === pathname)

		if (currentPageIndex !== -1) {
			const currentLinkElem = linksElemArray[currentPageIndex]

			linkUnderlineElem.style.width = `${currentLinkElem.offsetWidth}px`
			linkUnderlineElem.style.left = `${currentLinkElem.offsetLeft}px`
		} else {
			linkUnderlineElem.style.width = '0px'
			linkUnderlineElem.style.left = '0px'
		}
	}, [pathname])

	return (
		<div className={s.container}>
			<div className={s.links_container} ref={linksRef}>
				{navLinks.map((item, index) => (
					<div key={index} className={s.link}>
						<Link href={item.href}>{item.title}</Link>
					</div>
				))}
			</div>
			<div className={s.link_underline} ref={underlineRef} />
		</div>
	)
}
