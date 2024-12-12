/**
 * Formats a date, ignoring any locale jankiness
 * @param date string in `"YYYY-MM-DD" format
 */
export function formatDate(date: string) {
	const [yearNum, monthNum, dayNum] = date.split('-').map((item) => parseInt(item))
	const dateObj = new Date(yearNum, monthNum - 1, dayNum)

	const numInWeek = dateObj.getDay()

	const longDays = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	]
	const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

	const longMonths = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	]
	const shortMonths = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	]

	let suffix = ''
	if (dayNum === 1) {
		suffix = 'st'
	} else if (dayNum === 2) {
		suffix = 'nd'
	} else if (dayNum === 3) {
		suffix = 'rd'
	} else {
		suffix = 'th'
	}

	return {
		month: {
			num: monthNum,
			short: shortMonths[monthNum - 1],
			long: longMonths[monthNum - 1],
		},
		day: {
			num: dayNum,
			/**
			 * Zero-indexed ( `0-6` )
			 */
			numInWeek: numInWeek,
			short: shortDays[numInWeek],
			long: longDays[numInWeek],
			suffix: suffix,
		},
		year: yearNum,
	}
}
