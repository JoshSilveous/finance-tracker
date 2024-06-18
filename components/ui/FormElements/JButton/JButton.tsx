import { ButtonHTMLAttributes } from 'react'
import style from './JButton.module.scss'

interface Props {
	accent?: 'primary' | 'secondary'
	isLoading?: boolean
}

export function JButton({
	accent,
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Props) {
	return (
		<button
			className={`${style.main} ${accent === 'primary' ? style.primary : ''} ${
				className ? className : ''
			}`}
			{...props}
		/>
	)
}
