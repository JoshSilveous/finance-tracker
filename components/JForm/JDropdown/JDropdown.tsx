import { ChangeEvent } from 'react'
import s from './JDropdown.module.scss'
import { default as DropdownArrow } from '@/public/dropdown_arrow.svg'

export namespace JDropdownTypes {
	export interface Props {
		options: Option[]
		onChange: ChangeEventHandler
		defaultValue?: string | number
		placeholder?: string
		className?: string
	}
	export interface Option {
		name: string
		value: string | number
	}
	export type ChangeEventHandler = (e: ChangeEvent<HTMLSelectElement>) => void
}

export function JDropdown(props: JDropdownTypes.Props) {
	if (props.defaultValue === undefined && props.placeholder === undefined) {
		throw new Error(
			'You must provide either a defaultValue or placeholder for JDropdown components.'
		)
	}
	const optionsDisplay = props.options.map((option) => {
		return <option value={option.value}>{option.name}</option>
	})
	if (props.defaultValue === undefined) {
		optionsDisplay.unshift(<option value=''>{props.placeholder!}</option>)
	}
	return (
		<div className={`${s.main} ${props.className ? props.className : ''}`}>
			<select onChange={props.onChange}>{optionsDisplay}</select>
			<div className={s.custom_arrow}>
				<DropdownArrow />
			</div>
		</div>
	)
}
