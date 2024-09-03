import { InputHTMLAttributes } from 'react'

interface JTextProps extends InputHTMLAttributes<HTMLInputElement> {}

export function JText(props: JTextProps) {
	return <input {...props} type='text' />
}
