'use client'
import { useRef, useState } from 'react'
import s from './page.module.scss'
import { Tile } from '@/components/Tile/Tile'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'

export default function Dev() {
	return <div className={s.main}>dev</div>
}
