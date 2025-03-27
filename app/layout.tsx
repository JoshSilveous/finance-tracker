import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.scss'
import { BGLoadingWheel } from '@/utils/useBgLoad/useBgLoad'
import { ClientScrollbarWidthSetter } from '@/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'LedgerBoard',
	description: 'The Customizable Finance Tracker',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body className={inter.className}>
				{children}
				<BGLoadingWheel />
				<ClientScrollbarWidthSetter />
			</body>
		</html>
	)
}
