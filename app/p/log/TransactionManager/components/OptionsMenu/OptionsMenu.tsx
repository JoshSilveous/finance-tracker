import { HTMLAttributes, useEffect, useRef, useState } from 'react'
import s from './OptionsMenu.module.scss'
import { JButton } from '@/components/JForm'
import { default as OptionsIcon } from '@/public/options-vertical.svg'
import { delay } from '@/utils'
import { useFocusLoop } from '@/utils/focusLoop/useFocusLoop'

export type Option = {
	text: string
	icon?: any
	onClick: () => any
	className?: string
}

interface OptionsMenuProps extends HTMLAttributes<HTMLDivElement> {
	test_transaction_id: string
	width: number
	options: Option[]
}
export function OptionsMenu({
	width,
	test_transaction_id,
	options,
	className,
	...rest
}: OptionsMenuProps) {
	const [optionsIsOpen, setOptionsIsOpen] = useState(false)
	const [openedHeight, setOpenedHeight] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const togglerRef = useRef<HTMLButtonElement>(null)
	const optionsRef = useRef<HTMLButtonElement[]>([])
	const addToOptionsRef = (index: number) => (node: HTMLButtonElement | null) => {
		if (node !== null) {
			optionsRef.current[index] = node
		}
	}

	useFocusLoop({
		firstRef: togglerRef,
		lastRef: optionsRef,
		lastRefIndex: optionsRef.current.length - 1,
	})

	const TRANSITION_TIME_S = 0.5 // also defined in OptionsMenu.module.scss, update there as well

	useEffect(() => {
		if (optionsIsOpen) {
			optionsRef.current[0].focus()

			containerRef.current!.style.height = openedHeight + 'px'
			containerRef.current!.style.width = width + 'px'

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
			containerRef.current!.style.height = ''
			containerRef.current!.style.width = ''
		}

		containerRef.current!.classList.add(s.transitioning)
		delay(TRANSITION_TIME_S * 1000).then(() => {
			containerRef.current!.classList.remove(s.transitioning)
		})
	}, [optionsIsOpen])

	useEffect(() => {
		// calc opened height
		let height = 33.5

		optionsRef.current.forEach((node, index) => {
			height += node.offsetHeight
		})

		setOpenedHeight(height)
	}, [options.length])

	const optionsDisplay = options.map((option, index) => {
		return (
			<JButton
				jstyle='invisible'
				className={`${s.option} ${option.className ? option.className : ''}`}
				onClick={() => {
					setOptionsIsOpen(false)
					option.onClick()
				}}
				key={index}
				ref={addToOptionsRef(index)}
			>
				<div className={s.icon_container}>{option.icon ? option.icon : ''}</div>
				<div className={s.text_container}>{option.text}</div>
			</JButton>
		)
	})

	return (
		<div className={`${s.main} ${className ? className : ''}`} {...rest}>
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
