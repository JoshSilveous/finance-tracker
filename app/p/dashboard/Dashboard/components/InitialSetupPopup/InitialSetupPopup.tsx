import { useEffect, useState } from 'react'
import s from './InitialSetupPopup.module.scss'
import { CategoryItem } from './InitialSetupCategoryEditor/InitialSetupCategoryEditor'
import { genStages } from './genStages/genStages'
import { AccountItem } from './InitialSetupAccountEditor/InitialSetupAccountEditor'
import { default as LoadingAnim } from '@/public/loading.svg'
import {
	delay,
	getCurDate,
	getCurDateString,
	getDateString,
	getRandomArrItem,
	isStandardError,
	promptError,
} from '@/utils'
import {
	insertAccounts,
	insertCategories,
	insertTransactionAndItems,
	InsertTransactionEntry,
	reportErrorToDB,
	setInitSetupProgress,
	upsertAccounts,
	upsertCategories,
} from '@/database'
import { triggerTutorial } from '../../func/triggerTutorial/triggerTutorial'

export function InitialSetupPopup({
	closePopup,
	refreshAllData,
}: {
	closePopup: () => void
	refreshAllData: () => Promise<void>
}) {
	const [currentStage, setCurrentStage] = useState(1)
	const [catData, setCatData] = useState<CategoryItem[]>([
		{ id: crypto.randomUUID(), name: '' },
		{ id: crypto.randomUUID(), name: '' },
		{ id: crypto.randomUUID(), name: '' },
	])
	const [actData, setActData] = useState<AccountItem[]>([
		{ id: crypto.randomUUID(), name: '', starting_amount: '0.00' },
		{ id: crypto.randomUUID(), name: '', starting_amount: '0.00' },
		{ id: crypto.randomUUID(), name: '', starting_amount: '0.00' },
	])

	const stages = genStages(catData, setCatData, setCurrentStage, actData, setActData, () =>
		applyChangesAndProceed()
	)
	const progressBar = (() => {
		const items: JSX.Element[] = []
		for (let i = 1; i <= stages.length; i++) {
			let circleClassName = s.circle

			if (i < currentStage) {
				circleClassName += ' ' + s.before
			} else if (i === currentStage) {
				circleClassName += ' ' + s.current
			} else if (i > currentStage) {
				circleClassName += ' ' + s.after
			}

			items.push(<div className={circleClassName} key={`circle-${i}`}></div>)

			let barClassName = s.bar
			if (i >= currentStage) {
				barClassName += ' ' + s.after
			} else {
				barClassName += ' ' + s.before
			}

			if (i !== stages.length) {
				items.push(
					<div className={barClassName} key={`bar-${i}`}>
						<div className={s.progress} />
					</div>
				)
			}
		}
		return (
			<div className={s.progress_bar} key='progressBar'>
				{items}
			</div>
		)
	})()

	const applyChangesAndProceed = async () => {
		try {
			const initSetupPromise = setInitSetupProgress(true)

			const upsertCatPromise = (() => {
				const formattedCategories = catData
					.map((cat, index) => ({
						name: cat.name,
						order_position: index + 1,
					}))
					.filter((cat) => cat.name !== '')

				return insertCategories(formattedCategories)
			})()

			const upsertActPromise = (() => {
				const formattedAccounts = actData
					.map((act, index) => ({
						name: act.name,
						order_position: index + 1,
						starting_amount: Number(act.starting_amount),
					}))
					.filter((act) => act.name !== '')

				return insertAccounts(formattedAccounts)
			})()

			const [_, newCatIDs, newActIDs] = await Promise.all([
				initSetupPromise,
				upsertCatPromise,
				upsertActPromise,
			])

			const upsertTransactionPromise = (() => {
				const todayDate = getCurDateString()

				// generate a single-row transaction
				const transaction1: InsertTransactionEntry = {
					name: 'Example Transaction #1',
					date: todayDate,
					items: [
						{
							name: '',
							amount: '-200.44',
							category_id: getRandomArrItem(newCatIDs),
							account_id: getRandomArrItem(newActIDs),
						},
					],
				}

				// generate a multi-row transaction
				const transaction2: InsertTransactionEntry = {
					name: 'Example Transaction #2',
					date: todayDate,
					items: [
						{
							name: 'Item #1',
							amount: '-99.99',
							category_id: getRandomArrItem(newCatIDs),
							account_id: getRandomArrItem(newActIDs),
						},
						{
							name: 'Item #2',
							amount: '-49.99',
							category_id: getRandomArrItem(newCatIDs),
							account_id: getRandomArrItem(newActIDs),
						},
					],
				}

				return Promise.all([
					insertTransactionAndItems(transaction1),
					insertTransactionAndItems(transaction2),
				])
			})()

			await upsertTransactionPromise

			closePopup()
			await refreshAllData()
			triggerTutorial()
		} catch (e) {
			reportErrorToDB(e as Error)
			if (isStandardError(e)) {
				promptError(
					'An unexpected error has occurred while saving to the database:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
				console.error(e.message)
			}
		}
	}

	return (
		<div className={s.main}>
			<div className={s.stage_container}>
				<div className={s.progress_container}>{progressBar}</div>
				{currentStage <= stages.length ? (
					<div className={s.stage_content}>{stages[currentStage - 1]}</div>
				) : (
					<div className={s.saving_container}>
						<div className={s.icon_container}>
							<LoadingAnim />
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
