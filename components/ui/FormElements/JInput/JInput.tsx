import { InputHTMLAttributes } from 'react'
import style from './JInput.module.scss'

export function JInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return <input className={`${style.main} ${className ? className : ''}`} {...props} />
}
