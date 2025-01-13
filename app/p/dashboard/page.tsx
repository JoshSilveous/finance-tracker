import s from './page.module.scss'
import { Dashboard } from './Dashboard/Dashboard'

export default async function Home() {
	return (
		<div className={s.main}>
			<Dashboard />
		</div>
	)
}
