import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.scss'
import Navbar from '@/components/ui/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Finance Tracker',
	description: 'Get your money handled.',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body className={inter.className}>
				<Navbar />
				<main>{children}</main>
			</body>
		</html>
	)
}
