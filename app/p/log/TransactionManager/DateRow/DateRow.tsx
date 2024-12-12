import s from './DateRow.module.scss'

interface DateRowProps {
	date: string
}
export function DateRow({ date }: DateRowProps) {
	// let [yearNum, monthNum, dayNum] = date.split('-').map((item) => parseInt(item))
	// console.log(dayNum)
	// const dateObj = Date.UTC(yearNum, monthNum - 1, dayNum + 1)

	// const format = (option: Intl.DateTimeFormatOptions) => {
	// 	let formatter = new Intl.DateTimeFormat('utc', option)
	// 	return formatter.format(dateObj)
	// }

	// const dayOfWeek = format({ weekday: 'long' })
	// const month = format({ month: 'short' })
	// const dayOfMonth = parseInt(format({ day: 'numeric' }))
	// const year = format({ year: 'numeric' })

	// let dayOfMonthSuffix = ''
	// if (dayOfMonth === 1) {
	// 	dayOfMonthSuffix = 'st'
	// } else if (dayOfMonth === 2) {
	// 	dayOfMonthSuffix = 'nd'
	// } else if (dayOfMonth === 3) {
	// 	dayOfMonthSuffix = 'rd'
	// } else {
	// 	dayOfMonthSuffix = 'th'
	// }

	// figure this out once ChatGPT is working. Javascript doesn't seem to have an easy solution to this.

	// const formatted = `${dayOfWeek}, ${month} ${dayNum + dayOfMonthSuffix} ${year}`

	return <div className={s.container}>{date}</div>
}
