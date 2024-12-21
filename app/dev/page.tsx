'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useState } from 'react'
import s from './page.module.scss'
import { insertTransactionAndItems } from '@/database'

export default function Dev() {
	function submit() {
		insertTransactionAndItems({
			name: 'new transaction',
			date: '2024-12-22',
			items: [
				{ amount: '1253.32', name: 'test item', category_id: '', account_id: '' },
				{ amount: '1243.32', name: 'test item', category_id: '', account_id: '' },
				{ amount: '1223.32', name: 'test item', category_id: '', account_id: '' },
				{ amount: '1213.32', name: 'test item', category_id: '', account_id: '' },
				{ amount: '1523.32', name: 'test item', category_id: '', account_id: '' },
				{ amount: '1123.32', name: 'test item', category_id: '', account_id: '' },
			],
		})
	}
	return (
		<div className={s.main}>
			<button onClick={submit}>Test!</button>
		</div>
	)
}
