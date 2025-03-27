import {
	fetchCategoryTotals,
	CategoryTotal,
	fetchCategoryTotalsWithinDateRange,
	fetchAccountTotals,
	fetchAccountTotalsWithinDateRange,
} from '@/database'
import { getCurDateString, getCurDate, parseDateString, getDateString } from '@/utils'
import { Data, SimpleValuesTile } from '../../../hooks'
import { TotalEntry } from '../SimpleValues'

export async function getStartingAmounts(
	tileOptions: SimpleValuesTile['options'],
	data: Data.Controller
) {
	const tileType = tileOptions.show as 'categories' | 'accounts'
	const typeKey = tileType === 'categories' ? 'category_id' : 'account_id'
	const showDataFor = tileOptions.showDataFor

	// fetch totals from the database within the provided parameters

	const totalsFromDB = await (async () => {
		let rawFetchedTotals: TotalEntry[] = []

		if (showDataFor === 'all_time') {
			if (tileType === 'categories') {
				const fetched = await fetchCategoryTotals()
				rawFetchedTotals = fetched.map((it) => ({
					id: it.category_id,
					total_amount: it.total_amount,
				}))
			} else if (tileType === 'accounts') {
				const fetched = await fetchAccountTotals()
				rawFetchedTotals = fetched.map((it) => ({
					id: it.account_id,
					total_amount: it.total_amount,
				}))
			}
		} else {
			const customDay = tileOptions.customDay
			let startDate = ''
			let endDate = ''

			switch (showDataFor) {
				case 'past_month': {
					startDate = getCurDateString(-29)
					endDate = getCurDateString()
					break
				}
				case 'past_two_weeks': {
					startDate = getCurDateString(-13)
					endDate = getCurDateString()
					break
				}
				case 'past_week': {
					startDate = getCurDateString(-7)
					endDate = getCurDateString()
					break
				}
				case 'per_month': {
					startDate = (() => {
						const today = getCurDate()
						const thisMonth = (today.getUTCMonth() + 1)
							.toString()
							.padStart(2, '0')
						const thisYear = today.getUTCFullYear()
						return `${thisYear}-${thisMonth}-01`
					})()

					endDate = (() => {
						const start = parseDateString(startDate)
						start.setUTCMonth(start.getUTCMonth() + 1)
						start.setUTCDate(start.getUTCDate() - 1)
						return getDateString(start)
					})()

					break
				}

				case 'per_two_weeks': {
					startDate = (() => {
						const start = parseDateString(customDay)
						const current = getCurDate()

						const diffInTime = current.getTime() - start.getTime()
						const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24))

						const daysSinceLastInterval = diffInDays % 14
						const lastInterval = new Date(current)
						lastInterval.setDate(current.getDate() - daysSinceLastInterval + 1)

						return lastInterval.toLocaleDateString('en-CA')
					})()
					endDate = (() => {
						const endDate = parseDateString(startDate)
						endDate.setDate(endDate.getDate() + 14)
						return getDateString(endDate)
					})()

					break
				}
				case 'per_week': {
					startDate = (() => {
						const start = parseDateString(customDay)
						const current = getCurDate()

						const customDayOfWeek = start.getDay()
						const todayDayOfWeek = current.getDay()

						let diff = todayDayOfWeek - customDayOfWeek
						if (diff === 0) {
							return getDateString(current)
						}
						if (diff < 0) {
							diff += 7
						}

						return getCurDateString(0 - diff)
					})()
					endDate = (() => {
						const endDate = parseDateString(startDate)
						endDate.setDate(endDate.getDate() + 6)
						return getDateString(endDate)
					})()

					break
				}
			}

			if (tileType === 'categories') {
				const fetched = await fetchCategoryTotalsWithinDateRange(startDate, endDate)
				rawFetchedTotals = fetched.map((it) => ({
					id: it.category_id,
					total_amount: it.total_amount,
				}))
			} else if (tileType === 'accounts') {
				const fetched = await fetchAccountTotalsWithinDateRange(startDate, endDate)
				rawFetchedTotals = fetched.map((it) => ({
					id: it.account_id,
					total_amount: it.total_amount,
				}))
			}
		}
		let mappedTotals: TotalEntry[] = []

		mappedTotals = data.cur[tileType].map((act) => {
			const thisFetchedTotal = rawFetchedTotals.find((res) => res.id === act.id)
			if (thisFetchedTotal !== undefined) {
				return { id: act.id, total_amount: thisFetchedTotal.total_amount }
			} else {
				return { id: act.id, total_amount: 0 }
			}
		})

		const fetchedWithNoID = rawFetchedTotals.find((it) => it.id === '')

		mappedTotals.push({
			id: '',
			total_amount: fetchedWithNoID !== undefined ? fetchedWithNoID.total_amount : 0,
		})

		return mappedTotals
	})()

	// subtract the values of transactions that are loaded currently for the user (the SimpleValues tile will add these values back. this allows the values to dynamically update as the user changes them in TransactionManager)
	data.def.transactions.forEach((transaction) => {
		transaction.items.forEach((item) => {
			const amount = item.amount.val
			const dbTotalIndex = totalsFromDB.findIndex(
				(entry) => entry.id === item[typeKey].val
			)
			totalsFromDB[dbTotalIndex].total_amount -= Number(amount)
		})
	})

	return totalsFromDB
}
