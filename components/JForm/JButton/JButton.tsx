import { ButtonHTMLAttributes } from 'react'
import s from './JButton.module.scss'
import { default as LoadingAnim } from '@/public/loading.svg'

interface JButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	jstyle: 'primary' | 'secondary' | 'invisible'
	loading?: boolean
}

import React, { forwardRef } from 'react'

export const JButton = forwardRef<HTMLButtonElement, JButtonProps>(
	({ jstyle, loading, onClick, ...rest }, ref) => {
		return (
			<button
				ref={ref}
				type='button'
				{...rest}
				className={`${rest.className} ${s.jbutton} ${s[jstyle]} ${
					loading ? s.loading : ''
				}`}
				onClick={onClick && !loading ? onClick : undefined}
			>
				{loading ? <LoadingAnim /> : rest.children}
			</button>
		)
	}
)
JButton.displayName = 'JButton'
