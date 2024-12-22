import { ButtonHTMLAttributes } from 'react'
import s from './JButton.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'

interface JButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	jstyle: 'primary' | 'secondary' | 'invisible'
	loading?: boolean
}

import React, { forwardRef } from 'react'

export const JButton = forwardRef<HTMLButtonElement, JButtonProps>(
	({ jstyle, loading, ...props }, ref) => {
		return (
			<button
				ref={ref}
				type='button'
				{...props}
				className={`${props.className} ${s.jbutton} ${s[jstyle]} ${
					loading ? s.loading : ''
				}`}
			>
				{loading ? <LoadingAnim /> : props.children}
			</button>
		)
	}
)
JButton.displayName = 'JButton'
