'use client'
import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import s from './JFlyoutMenu.module.scss'
import { clearFocusLoop, createFocusLoop, delay } from '@/utils'

interface JFlyoutMenuProps {
	jstyle: 'primary' | 'secondary'
	title: JSX.Element
	options: {
		content: JSX.Element
		onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
	}[]
	className?: string
}
export const JFlyoutMenu = forwardRef<HTMLButtonElement, JFlyoutMenuProps>(
	({ jstyle, title, options, className }, ref) => {
		const [isOpen, setIsOpen] = useState(false)
		const BUTTON_HEIGHT = 36
		const GAP_HEIGHT = 0
		const TABINDEX_OFFSET = 1000

		const openedHeight = BUTTON_HEIGHT + options.length * (BUTTON_HEIGHT + GAP_HEIGHT)

		const expandableContainerRef = useRef<HTMLDivElement>(null)
		const toggleButtonRef = useRef<HTMLButtonElement>()
		const lastOptionRef = useRef<HTMLButtonElement>(null)

		const optionsDisplay = options.map((option, index) => {
			const tabIndex = !isOpen ? -1 : index + 2 + TABINDEX_OFFSET
			return (
				<div className={s.option_container} key={index}>
					<button
						onClick={(e) => {
							setIsOpen(false)
							option.onClick(e)
						}}
						className={`${s[jstyle]} ${s.option}`}
						tabIndex={tabIndex}
						ref={index === options.length - 1 ? lastOptionRef : undefined}
					>
						{option.content}
					</button>
				</div>
			)
		})

		function shouldOpenUpward() {
			const distanceToBottom =
				window.innerHeight -
				expandableContainerRef.current!.getBoundingClientRect().bottom

			if (distanceToBottom < openedHeight) {
				return true
			} else {
				return false
			}
		}

		useLayoutEffect(() => {
			if (isOpen) {
				createFocusLoop(toggleButtonRef.current!, lastOptionRef.current!)

				const windowClickHandler = () => {
					setIsOpen(false)
					window.removeEventListener('click', windowClickHandler)
				}
				delay(10).then(() => {
					window.addEventListener('click', windowClickHandler)
				})
				toggleButtonRef.current!.tabIndex = 1 + TABINDEX_OFFSET
				if (shouldOpenUpward()) {
					expandableContainerRef.current!.classList.add(s.open_upward)
					expandableContainerRef.current!.style.flexDirection = 'column'
					expandableContainerRef.current!.style.top = ''
					expandableContainerRef.current!.style.bottom = '0'
				} else {
					expandableContainerRef.current!.classList.add(s.open_downward)
					expandableContainerRef.current!.style.flexDirection = 'column-reverse'
					expandableContainerRef.current!.style.top = '0'
					expandableContainerRef.current!.style.bottom = ''
				}
				expandableContainerRef.current!.style.height = openedHeight + 'px'
			} else {
				clearFocusLoop(toggleButtonRef.current!, lastOptionRef.current!)
				toggleButtonRef.current!.tabIndex = 0
				expandableContainerRef.current!.classList.remove(s.open_upward)
				expandableContainerRef.current!.classList.remove(s.open_downward)
				expandableContainerRef.current!.style.height = '36px'

				// check if an option is focused and, if so, switch focus back to button
				if (
					document.activeElement &&
					document.activeElement.classList.contains(s.option)
				) {
					toggleButtonRef.current!.focus()
				}
			}
		}, [isOpen])
		return (
			<div className={`${s.stable_container} ${className ? className : ''}`}>
				<div
					ref={expandableContainerRef}
					className={`${s.expandable_container} ${s[jstyle]}`}
				>
					<div className={s.options_wrapper}>{optionsDisplay}</div>
					<button
						type='button'
						ref={(node) => {
							if (node !== null) {
								toggleButtonRef.current = node
							}
							if (ref) {
								if (typeof ref === 'function') {
									ref(node)
								} else {
									ref.current = node
								}
							}
						}}
						className={`${s.toggle} ${s[jstyle]}`}
						onClick={() => setIsOpen((p) => !p)}
					>
						{title}
					</button>
				</div>
			</div>
		)
	}
)
JFlyoutMenu.displayName = 'JFlyoutMenu'
