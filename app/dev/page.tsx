'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useState } from 'react'
import s from './page.module.scss'
import { NewJNumberAccounting } from '@/components/JForm/NewJNumberAccounting/NewJNumberAccounting'

export default function Dev() {
	return (
		<div className={s.main}>
			<NewJNumberAccounting />
		</div>
	)
}
