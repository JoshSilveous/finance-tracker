import { SetStateAction, useEffect, useRef, useState } from 'react'
import s from './NewSimpleValuesPopup.module.scss'
import { JRadio } from '@/components/JForm/JRadio/JRadio'
import { JButton, JInput } from '@/components/JForm'
import { JCheckbox } from '@/components/JForm/JCheckbox/JCheckbox'
import { Data } from '../../hooks'
import { createFocusLoop, delay } from '@/utils'
import { SimpleValuesTile, TileData } from '../../tiles'
import { GRID_SPACING } from '@/app/globals'
import { simpleValuesTileDefaults } from '../../tiles/SimpleValues/SimpleValues'

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
	})
	const firstNodeRef = useRef<HTMLInputElement>(null)
	const lastNodeRef = useRef<HTMLButtonElement>(null)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
				const checked = e.currentTarget.checked
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
					zIndex: clone.length,
					options: structuredClone(formData),
				})
			)
			return clone
		})

		closePopup()
	}

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
						onChange={handleChange}
					>
						Categories
					</JRadio>
					<JRadio
						name='show'
						data-key='show'
						data-radio_option='accounts'
						checked={formData.show === 'accounts'}
						onChange={handleChange}
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
