'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useState } from 'react'
import s from './page.module.scss'
import { insertTransactionAndItems } from '@/database'
import { JCheckbox } from '@/components/JForm/JCheckbox/JCheckbox'

export default function Dev() {
	return (
		<div className={s.main}>
			<JCheckbox />
		</div>
	)
}
