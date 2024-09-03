import { InputHTMLAttributes } from 'react'

interface JNumberAccountingProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function JNumberAccounting(props: JNumberAccountingProps) {
	return <input {...props} type='number' />
}
