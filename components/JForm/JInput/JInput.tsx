import { InputHTMLAttributes, RefObject } from 'react'
import s from './JInput.module.scss'

interface JInputProps extends InputHTMLAttributes<HTMLInputElement> {
	ref?: RefObject<HTMLInputElement>
}

export function JInput(props: JInputProps) {
	return <input {...props} className={`${props.className} ${s.jinput}`} />
}
