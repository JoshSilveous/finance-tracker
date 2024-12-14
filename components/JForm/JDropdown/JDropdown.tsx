import { ChangeEvent, DetailedHTMLProps, SelectHTMLAttributes } from 'react'
import s from './JDropdown.module.scss'
import { default as DropdownArrow } from '@/public/dropdown_arrow.svg'
import { default as LoadingAnim } from '@/public/loading.svg'

export namespace JDropdownTypes {
	export interface Props
		extends DetailedHTMLProps<
			SelectHTMLAttributes<HTMLSelectElement>,
			HTMLSelectElement
		> {
		options: Option[]
		placeholder?: string
		className?: string
		loading?: boolean
	}
	export interface Option {
		name: string
		value: string | number
	}
}

export function JDropdown({
	options,
	placeholder,
	className,
	loading,
	...rest
}: JDropdownTypes.Props) {
	const optionsDisplay = options.map((option, index) => {
		return (
			<option value={option.value} key={index}>
				{option.name}
			</option>
		)
	})
	if (rest.value === undefined) {
		optionsDisplay.unshift(<option value=''>{placeholder ? placeholder : ''}</option>)
	}
	return (
		<div className={`${s.main} ${className ? className : ''}`}>
			{loading && (
				<div className={s.loading}>
					<LoadingAnim />
				</div>
			)}
			<select {...rest}>{loading ? '' : optionsDisplay}</select>
			<div className={s.custom_arrow}>
				<DropdownArrow />
			</div>
		</div>
	)
}
