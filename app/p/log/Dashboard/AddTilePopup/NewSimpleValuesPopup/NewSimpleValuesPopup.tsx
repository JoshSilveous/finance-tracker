import { SetStateAction, useEffect, useRef, useState } from 'react'
import s from './NewSimpleValuesPopup.module.scss'
import { JRadio } from '@/components/JForm/JRadio/JRadio'
import { JButton, JInput } from '@/components/JForm'
import { JCheckbox } from '@/components/JForm/JCheckbox/JCheckbox'
import { Data } from '../../hooks'
import { createFocusLoop, delay, getDateString } from '@/utils'
import { SimpleValuesTile, TileData } from '../../tiles'
import { GRID_SPACING } from '@/app/globals'
import { simpleValuesTileDefaults } from '../../tiles/SimpleValues/SimpleValues'
import { JDropdownTypes, JDropdown } from '@/components/JForm/JDropdown/JDropdown'

interface NewSimpleValuesPopupProps {
	setTileData: (value: SetStateAction<TileData[]>) => void
	data: Data.Controller
	closePopup: () => void
}
export function NewSimpleValuesPopup({
	setTileData,
	data,
	closePopup,
}: NewSimpleValuesPopupProps) {
	const [formData, setFormData] = useState<SimpleValuesTile['options']>({
		exclude: [],
		show: 'categories',
		title: '',
		showTitle: false,
		showDataFor: 'all_time',
		customDay: getDateString(),
	})
	const firstNodeRef = useRef<HTMLInputElement>(null)
	const lastNodeRef = useRef<HTMLButtonElement>(null)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const key = e.currentTarget.dataset.key

		switch (key) {
			case 'title': {
				const value = e.currentTarget.value
				setFormData((prev) => {
					const clone = structuredClone(prev)
					clone.title = value
					return clone
				})
				break
			}
			case 'showTitle': {
				const checked = (e.currentTarget as HTMLInputElement).checked
				setFormData((prev) => {
					const clone = structuredClone(prev)
					clone.showTitle = checked
					return clone
				})
				break
			}
			case 'show': {
				const option = e.currentTarget.dataset.radio_option as
					| 'categories'
					| 'accounts'
				setFormData((prev) => {
					const clone = structuredClone(prev)
					clone.show = option
					return clone
				})
			}
			case 'exclude': {
				const catID = e.target.id
				setFormData((prev) => {
					const clone = structuredClone(prev)
					const index = clone.exclude.indexOf(catID)
					if (index === -1) {
						clone.exclude.push(catID)
					} else {
						clone.exclude.splice(index, 1)
					}
					return clone
				})
			}
			case 'showDataFor': {
				const value = e.target.value
				setFormData((prev) => {
					const clone = structuredClone(prev)
					clone.showDataFor = value as SimpleValuesTile['options']['showDataFor']
					clone.customDay = getDateString()
					return clone
				})
				break
			}
			case 'customDay': {
				const value = e.target.value
				setFormData((prev) => {
					const clone = structuredClone(prev)
					clone.customDay = value
					return clone
				})
				break
			}
		}
	}

	useEffect(() => {
		delay(20).then(() => {
			firstNodeRef.current!.focus()
		})
		const loop = createFocusLoop({ firstRef: firstNodeRef, lastRef: lastNodeRef })

		return loop.cleanup
	}, [])

	const handleCreate = async () => {
		setTileData((prev) => {
			const clone = structuredClone(prev)
			clone.push(
				structuredClone({
					type: 'simple_values',
					position: {
						top: GRID_SPACING,
						left: GRID_SPACING,
					},
					size: {
						width: simpleValuesTileDefaults.minWidth!,
						height: simpleValuesTileDefaults.minHeight!,
					},
					id: `PENDING_CREATION||${crypto.randomUUID()}`,
					zIndex: clone.length + 1,
					options: structuredClone(formData),
				})
			)
			return clone
		})

		closePopup()
	}

	const ShowDataSection = (() => {
		const showDataForOptions: JDropdownTypes.Option[] = [
			{ name: 'For all time', value: 'all_time' },
			{ name: 'Per week', value: 'per_week' },
			{ name: 'Per two weeks', value: 'per_two_weeks' },
			{ name: 'Per month', value: 'per_month' },
			{ name: 'Past week (7 days)', value: 'past_week' },
			{ name: 'Past two weeks (14 days)', value: 'past_two_weeks' },
			{ name: 'Past month (31 days)', value: 'past_month' },
		]

		const PerWeekSelector = (() => {
			const datesOfThisWeek = (() => {
				const today = new Date()
				const dayOfWeek = today.getDay()

				const startOfWeek = new Date(today)
				startOfWeek.setDate(today.getDate() - dayOfWeek)

				const datesOfWeek: string[] = []
				for (let i = 0; i < 7; i++) {
					const date = new Date(startOfWeek)
					date.setDate(startOfWeek.getDate() + i)

					// Format the date as YYYY-MM-DD
					const formattedDate = date.toISOString().split('T')[0]
					datesOfWeek.push(formattedDate)
				}

				return datesOfWeek
			})()

			const dayOfWeekOptions = [
				{ name: 'Sunday', value: datesOfThisWeek[1] },
				{ name: 'Monday', value: datesOfThisWeek[2] },
				{ name: 'Tuesday', value: datesOfThisWeek[3] },
				{
					name: 'Wednesday',
					value: datesOfThisWeek[4],
				},
				{
					name: 'Thursday',
					value: datesOfThisWeek[5],
				},
				{ name: 'Friday', value: datesOfThisWeek[6] },
				{
					name: 'Saturday',
					value: datesOfThisWeek[7],
				},
			]

			return (
				<JDropdown
					options={dayOfWeekOptions}
					value={formData.customDay}
					data-key='customDay'
					id='perSelector'
					onChange={handleChange}
				/>
			)
		})()

		const PerTwoWeeksSelector = (() => {
			const pastTwoWeeksOptions = (() => {
				const today = new Date()
				const dayOfWeek = today.getDay()

				const startOfCurrentWeek = new Date(today)
				startOfCurrentWeek.setDate(today.getDate() - dayOfWeek)

				const startOfPreviousWeek = new Date(startOfCurrentWeek)
				startOfPreviousWeek.setDate(startOfCurrentWeek.getDate() - 7)

				const datesOfCurrentWeek: JDropdownTypes.Option[] = []
				const datesOfPreviousWeek: JDropdownTypes.Option[] = []

				const genNameFormat = (date: Date): string => {
					const options: Intl.DateTimeFormatOptions = {
						weekday: 'short',
						month: 'short',
						day: 'numeric',
					}
					return date.toLocaleDateString('en-US', options)
				}

				for (let i = 0; i < 7; i++) {
					const thisWeekDate = new Date(startOfCurrentWeek)
					thisWeekDate.setDate(startOfCurrentWeek.getDate() + i)
					const thisWeekFormattedValue = thisWeekDate.toISOString().split('T')[0]

					datesOfCurrentWeek.push({
						value: thisWeekFormattedValue,
						name: genNameFormat(thisWeekDate),
					})

					const lastWeekDate = new Date(startOfPreviousWeek)
					lastWeekDate.setDate(startOfPreviousWeek.getDate() + i)
					const lastWeekFormattedValue = lastWeekDate.toISOString().split('T')[0]
					datesOfPreviousWeek.push({
						value: lastWeekFormattedValue,
						name: genNameFormat(lastWeekDate),
					})
				}

				return [...datesOfPreviousWeek, ...datesOfCurrentWeek]
			})()

			return (
				<JDropdown
					id='perSelector'
					options={pastTwoWeeksOptions}
					data-key='customDay'
					value={formData.customDay}
					onChange={handleChange}
				/>
			)
		})()

		return (
			<div className={s.show_data_container}>
				<div>
					<label htmlFor='showDataFor'>Show data...</label>
					<JDropdown
						id='showDataFor'
						options={showDataForOptions}
						value={formData.showDataFor}
						data-key='showDataFor'
						onChange={handleChange}
					/>
				</div>
				{(formData.showDataFor === 'per_week' ||
					formData.showDataFor === 'per_two_weeks') && (
					<div>
						<label htmlFor='perSelector'>Starting On...</label>
						{formData.showDataFor === 'per_week' && PerWeekSelector}
						{formData.showDataFor === 'per_two_weeks' && PerTwoWeeksSelector}
					</div>
				)}
			</div>
		)
	})()

	return (
		<div className={s.main}>
			<h3>New "Simple Values" Tile</h3>
			<div className={s.title_container}>
				<div className={s.title}>
					<label htmlFor='title'>Title:</label>
					<JInput
						id='title'
						ref={firstNodeRef}
						value={formData.title}
						data-key='title'
						onChange={handleChange}
					/>
				</div>
				<div className={s.show_title}>
					<JCheckbox
						id='show_title'
						bgColor='var(--bg-color-lighter-2)'
						checked={formData.showTitle}
						data-key='showTitle'
						onChange={handleChange}
					/>
					<label htmlFor='show_title'>Show Title on Dashboard</label>
				</div>
			</div>
			<div className={s.show_container}>
				<div>Show:</div>
				<div>
					<JRadio
						name='show'
						data-key='show'
						id='show_categories'
						data-radio_option='categories'
						checked={formData.show === 'categories'}
						onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
					>
						Categories
					</JRadio>
					<JRadio
						name='show'
						data-key='show'
						data-radio_option='accounts'
						checked={formData.show === 'accounts'}
						onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
					>
						Accounts
					</JRadio>
				</div>
			</div>
			<div className={s.exclude_container}>
				<div className={s.title}>Exclude:</div>
				<div className={s.item_container}>
					{formData.show === 'categories'
						? [
								...data.cur.categories.map((cat) => {
									return (
										<div className={s.item} key={cat.id}>
											<JCheckbox
												id={cat.id}
												data-key='exclude'
												checked={formData.exclude.includes(cat.id)}
												bgColor='var(--bg-color-lighter-3)'
												onChange={handleChange}
											/>
											<label htmlFor={cat.id}>{cat.name.val}</label>
										</div>
									)
								}),
								<div className={s.item}>
									<JCheckbox
										id='no_category'
										data-key='exclude'
										checked={formData.exclude.includes('no_category')}
										bgColor='var(--bg-color-lighter-3)'
										onChange={handleChange}
									/>
									<label htmlFor='no_category'>No Category</label>
								</div>,
						  ]
						: [
								...data.cur.accounts.map((act) => {
									return (
										<div className={s.item} key={act.id}>
											<JCheckbox
												id={act.id}
												data-key='exclude'
												checked={formData.exclude.includes(act.id)}
												bgColor='var(--bg-color-lighter-3)'
												onChange={handleChange}
											/>
											<label htmlFor={act.id}>{act.name.val}</label>
										</div>
									)
								}),
								<div className={s.item}>
									<JCheckbox
										id='no_account'
										data-key='exclude'
										checked={formData.exclude.includes('no_account')}
										bgColor='var(--bg-color-lighter-3)'
										onChange={handleChange}
									/>
									<label htmlFor='no_account'>No Account</label>
								</div>,
						  ]}
				</div>
			</div>
			{ShowDataSection}
			<div className={s.button_container}>
				<JButton jstyle='secondary' onClick={closePopup}>
					Cancel
				</JButton>
				<JButton jstyle='primary' onClick={handleCreate} ref={lastNodeRef}>
					Create
				</JButton>
			</div>
		</div>
	)
}
