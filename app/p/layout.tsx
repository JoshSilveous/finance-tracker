import NavBar from '@/components/NavBar/NavBar'
import s from './layout.module.scss'
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<div className={s.main}>
			<div className={s.navbar_container}>
				<NavBar />
			</div>
			<div className={s.content_container}>{children}</div>
		</div>
	)
}
