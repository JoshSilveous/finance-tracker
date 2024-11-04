import { CategoryManager } from './CategoryManager/CategoryManager'
import s from './page.module.scss'

export default async function Accounts() {
	return (
		<div className={s.main}>
			<CategoryManager />
		</div>
	)
}
