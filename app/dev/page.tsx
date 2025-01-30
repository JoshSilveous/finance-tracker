'use client'
import { useRef, useState } from 'react'
import s from './page.module.scss'
import { Tile } from '@/app/p/dashboard/Dashboard/hooks/useTiles/Tile/Tile'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'
import { JButton } from '@/components/JForm'
import { JFlyoutMenu } from '@/components/JFlyoutMenu/JFlyoutMenu'

export default function Dev() {
	return (
		<div className={s.main}>
			<div className={s.container}>
				<JButton jstyle='primary'>OTHER</JButton>
				<div style={{ height: '10px' }} />
				<JFlyoutMenu
					jstyle='secondary'
					title={<>OTHER</>}
					options={[
						{ content: <>Item 1</>, onClick: () => console.log('hi!') },
						{ content: <>Item 2</>, onClick: () => console.log('hi!') },
						{ content: <>Item 3</>, onClick: () => console.log('hi!') },
					]}
				/>
				<div style={{ height: '10px' }} />
				<JButton jstyle='primary'>OTHER</JButton>
			</div>
		</div>
	)
}
