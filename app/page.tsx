import Image from 'next/image'
import styles from './page.module.scss'
import Link from 'next/link'

export default function Home() {
	return (
		<main className={styles.main}>
			<h1>Finance Tracker!</h1>
			<Link href='/login'>Login</Link>
			<Link href='/private'>Private Page</Link>
		</main>
	)
}
