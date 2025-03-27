import { formatDate, getCurDateString } from '@/utils'
import s from './SimpleValuesSettingsPopup.module.scss'
import { SimpleValuesTile } from '../../../hooks'

export function genExplanationSection(formData: SimpleValuesTile['options']) {
	let text = null
	const customDayFormatted = formatDate(
		formData.customDay ? formData.customDay : getCurDateString()
	)
	if (formData.show === 'accounts') {
		switch (formData.showDataFor) {
			case 'all_time': {
				text = (
					<span>
						show the <strong>current values</strong> of your accounts (the{' '}
						<strong>balance</strong> of your accounts)
					</span>
				)
				break
			}
			case 'per_week': {
				text = (
					<span>
						show the <strong>balance difference</strong> of your accounts between
						now and last <strong>{customDayFormatted.day.long}</strong>
					</span>
				)
				break
			}
			case 'per_two_weeks': {
				text = (
					<span>
						show the <strong>balance difference</strong> of your accounts for
						each <strong>two-week period</strong>, starting from the specified
						date and continuing at two-week intervals
					</span>
				)
				break
			}
			case 'per_month': {
				text = (
					<span>
						show the <strong>balance difference</strong> of your accounts for
						each <strong>calendar month</strong>, starting from the beginning of
						the earliest recorded month and continuing to the present
					</span>
				)
				break
			}
			case 'past_week': {
				text = (
					<span>
						show the <strong>balance difference</strong> of your accounts over
						the <strong>past 7 days</strong>
					</span>
				)
				break
			}
			case 'past_two_weeks': {
				text = (
					<span>
						show the <strong>balance difference</strong> of your accounts over
						the <strong>past 14 days</strong> (two weeks)
					</span>
				)
				break
			}
			case 'past_month': {
				text = (
					<span>
						show the <strong>balance difference</strong> of your accounts over
						the <strong>past 30 days</strong> (approximately one month)
					</span>
				)
				break
			}
		}
	} else if (formData.show === 'categories') {
		switch (formData.showDataFor) {
			case 'all_time': {
				text = (
					<span>
						show the <strong>total spending</strong> and{' '}
						<strong>earnings</strong> for each category over{' '}
						<strong>all time</strong>
					</span>
				)
				break
			}
			case 'per_week': {
				text = (
					<span>
						show the <strong>spending</strong> and <strong>earnings</strong> for
						each category between now and last{' '}
						<strong>{customDayFormatted.day.long}</strong>
					</span>
				)
				break
			}
			case 'per_two_weeks': {
				text = (
					<span>
						show the <strong>spending</strong> and <strong>earnings</strong> for
						each category for every <strong>two-week period</strong>, starting
						from the specified date and continuing at two-week intervals
					</span>
				)
				break
			}
			case 'per_month': {
				text = (
					<span>
						show the <strong>spending</strong> and <strong>earnings</strong> for
						each category for every <strong>calendar month</strong>, starting
						from the beginning of the earliest recorded month and continuing to
						the present
					</span>
				)
				break
			}
			case 'past_week': {
				text = (
					<span>
						show the <strong>spending</strong> and <strong>earnings</strong> for
						each category over the <strong>past 7 days</strong>
					</span>
				)
				break
			}
			case 'past_two_weeks': {
				text = (
					<span>
						show the <strong>spending</strong> and <strong>earnings</strong> for
						each category over the <strong>past 14 days</strong> (two weeks)
					</span>
				)
				break
			}
			case 'past_month': {
				text = (
					<span>
						show the <strong>spending</strong> and <strong>earnings</strong> for
						each category over the <strong>past 30 days</strong> (approximately
						one month)
					</span>
				)
				break
			}
		}
	}

	return (
		<div className={s.explanation_container}>
			<div className={s.heading}>This tile will...</div>
			<div>{text}</div>
		</div>
	)
}
