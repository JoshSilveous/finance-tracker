import { Data } from '../../hooks'
import s from './SimpleValues.module.scss'
export interface SimpleValuesProps {
	data: Data.Controller
}
export function SimpleValues({ data }: SimpleValuesProps) {
	return <div className={s.main}>Simple Values!</div>
}
