'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useState } from 'react'
import s from './page.module.scss'

export default function Dev() {
	const itemcount = 1000

	const items: JSX.Element[] = []
	for (let i = 0; i < itemcount; i++) {
		items.push(<div className={s.grid_item}>Content {i + 1}</div>)
	}
	return (
		<div className={s.scrollable_container}>
			<div>
				<div className={s.grid_container}>
					<div>
						<div className={`${s.grid_item}  ${s.sticky}`}>
							Measurement Selector 1
						</div>
					</div>
					<div>
						<div className={`${s.grid_item}  ${s.sticky}`}>
							Measurement Selector 2
						</div>
					</div>
					<div>
						<div className={`${s.grid_item}  ${s.sticky}`}>
							Measurement Selector 3
						</div>
					</div>

					{items}
				</div>
			</div>
		</div>
	)
}
