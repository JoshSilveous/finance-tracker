import { HTMLAttributes, useEffect, useRef, useState } from 'react'
import s from './OptionsMenu.module.scss'
import { JButton } from '@/components/JForm'
import { default as OptionsIcon } from '@/public/options-vertical.svg'
import { delay } from '@/utils'
import { createFocusLoop } from '@/utils/focusLoop/createFocusLoop'

export type Option = {
	text: string
	icon?: any
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => any
	className?: string
}

interface OptionsMenuProps extends HTMLAttributes<HTMLButtonElement> {
	test_transaction_id: string
	width: number
	height: number
	options: Option[]
}
export function OptionsMenu({
	width,
	height,
	test_transaction_id,
	options,
	className,
	tabIndex,
	...rest
}: OptionsMenuProps) {
	const [optionsIsOpen, setOptionsIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const togglerRef = useRef<HTMLButtonElement>(null)
	const optionsRef = useRef<HTMLButtonElement[]>([])
	const addToOptionsRef = (index: number) => (node: HTMLButtonElement | null) => {
		if (node !== null) {
			optionsRef.current[index] = node
		}
	}

	useEffect(() => {
		if (optionsIsOpen) {
			const focusLoop = createFocusLoop({
				firstRef: togglerRef,
				lastRef: optionsRef,
				lastRefIndex: optionsRef.current.length - 1,
			})
			return focusLoop.cleanup
		}
	}, [optionsIsOpen, togglerRef, optionsRef])

	const TRANSITION_TIME_S = 0.3 // also defined in OptionsMenu.module.scss, update there as well

	useEffect(() => {
		if (containerRef.current) {
			if (optionsIsOpen) {
				optionsRef.current[0].focus()

				containerRef.current.style.height = height + 'px'
				containerRef.current.style.width = width + 'px'

				// close moreControlsRef when opened and user clicks outside
				const handleWindowClick = (e: MouseEvent) => {
					const target = e.target as Node | null
					if (
						containerRef.current &&
						target &&
						!containerRef.current.contains(target)
					) {
						setOptionsIsOpen(false)
						window.removeEventListener('mousedown', handleWindowClick)
					}
				}
				window.addEventListener('mousedown', handleWindowClick)
			} else {
				containerRef.current.style.height = ''
				containerRef.current.style.width = ''
			}

			containerRef.current.classList.add(s.transitioning)
			delay(TRANSITION_TIME_S * 1000).then(() => {
				if (containerRef.current) {
					containerRef.current.classList.remove(s.transitioning)
				}
			})
		}
	}, [optionsIsOpen])

	const toggleButtonIndex = optionsIsOpen ? 100000 : tabIndex ? tabIndex : undefined

	const optionsDisplay = options.map((option, index) => {
		return (
			<JButton
				jstyle='invisible'
				className={`${s.option} ${option.className ? option.className : ''}`}
				onClick={(e) => {
					setOptionsIsOpen(false)
					togglerRef.current?.focus()
					option.onClick(e)
				}}
				key={index}
				tabIndex={toggleButtonIndex ? toggleButtonIndex + index + 1 : undefined}
				ref={addToOptionsRef(index)}
			>
				<div className={s.icon_container}>{option.icon ? option.icon : ''}</div>
				<div className={s.text_container}>{option.text}</div>
			</JButton>
		)
	})

	return (
		<div className={`${s.main} ${className ? className : ''}`}>
			<div
				className={`${s.popout} ${optionsIsOpen ? s.revealed : ''}`}
				ref={containerRef}
			>
				<div className={s.top_container}>
					<div className={s.title_container}>
						<div className={s.title}>Options</div>
					</div>
					<JButton
						jstyle='invisible'
						{...rest}
						tabIndex={toggleButtonIndex}
						ref={togglerRef}
						onClick={() => setOptionsIsOpen((prev) => !prev)}
					>
						<OptionsIcon />
					</JButton>
				</div>
				<div className={s.options_container}>{optionsDisplay}</div>
			</div>
		</div>
	)
}
