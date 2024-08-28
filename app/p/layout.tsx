import { SignOutButton } from '@/components/NavBar/SignOutButton'
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<div>
			This is the NavBar which only shows while signed in.
			{children}
			<SignOutButton />
		</div>
	)
}
