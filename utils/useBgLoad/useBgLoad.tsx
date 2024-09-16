'use client'
import React, { useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { default as LoadingAnim } from '@/public/loading.svg'
import s from './useBgLoad.module.scss'

/**
 * ```ts
 * interface BGLoadController = {
 * 	start: () => void
 * 	stop: () => void
 * }
 * ```
 * Returns an object used to control the state of a subtle "loading" effect in the bottom-right of the screen.
 *
 *
 * `start()` calls can be overlapped. If `start()` is called multiple times, the loader will not disappear until `stop()` has been called the same amount of times. This works in any context, and across components
 *
 * @example
 * ```ts
 * const bgLoad = useBgLoad()
 *
 * async function handleSomething() {
 * 	bgLoad.start()
 * //  ... async code ...
 * 	bgLoad.end()
 * }
 * ```
 */
export function useBgLoad(): BGLoadController {
	return {
		start() {
			const node = document.querySelector(`.${s.main}`) as HTMLDivElement
			if (node === undefined) {
				console.error('BGLoadingWheel must be placed in the DOM!')
			}
			const counter = parseInt(node.dataset.counter!)
			if (counter === 0) {
				node.classList.add(s.visible)
			}
			node.dataset.counter = (counter + 1).toString()
		},
		stop() {
			const node = document.querySelector(`.${s.main}`) as HTMLDivElement
			if (node === undefined) {
				console.error('BGLoadingWheel must be placed in the DOM!')
			}
			const counter = parseInt(node.dataset.counter!)
			if (counter === 1) {
				node.classList.remove(s.visible)
			}
			node.dataset.counter = (counter - 1).toString()
		},
	}
}

/**
 * Required to be placed somewhere under the body for useBgLoad() to work
 */
export function BGLoadingWheel() {
	return (
		<div className={s.main} data-counter='0'>
			<LoadingAnim />
		</div>
	)
}

/**
 * ```ts
 * interface BGLoadController = {
 * 	start: () => void
 * 	stop: () => void
 * }
 * ```
 * Used to control the state of a subtle "loading" effect in the bottom-right of the screen.
 *
 * `start()` calls can be overlapped. If `start()` is called multiple times, the loader will not disappear until `stop()` has been called the same amount of times. This works in any context, and across components
 *
 * @example
 * ```ts
 * const bgLoad = useBgLoad()
 *
 * async function handleSomething() {
 * 	bgLoad.start()
 * //  ... async code ...
 * 	bgLoad.end()
 * }
 * ```
 */
export interface BGLoadController {
	/**
	 * Starts the loading effect. This CAN be called multiple times (and won't overlap visually), as long as each call is eventually met with a `BGLoadController.close()`.
	 */
	start: () => void
	/**
	 * Stops the loading effect. If multiple instances of `BGLoadController.start()` are called simultaneously, this will only remove the loader after the final instance is met with a `BGLoadController.close()`.
	 */
	stop: () => void
}
