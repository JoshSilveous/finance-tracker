import { DetailedHTMLProps, forwardRef, SelectHTMLAttributes } from 'react'
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

export const JDropdown = forwardRef<HTMLSelectElement, JDropdownTypes.Props>(
	({ options, placeholder, className, loading, ...rest }, ref) => {
		const optionsDisplay = options.map((option, index) => {
			return (
				<option value={option.value} key={index}>
					{option.name}
				</option>
			)
		})
		if (rest.value === undefined) {
			optionsDisplay.unshift(
				<option value='' key={-1}>
					{placeholder ? placeholder : ''}
				</option>
			)
		}
		return (
			<div className={`${s.main} ${className ? className : ''}`}>
				{loading && (
					<div className={s.loading}>
						<LoadingAnim />
					</div>
				)}
				<select ref={ref} {...rest}>
					{loading ? '' : optionsDisplay}
				</select>
				<div className={s.custom_arrow}>
					<DropdownArrow />
				</div>
			</div>
		)
	}
)
JDropdown.displayName = 'JDropdown'
