import s from './triggerTutorial.module.scss'
import { createPopup, delay } from '@/utils'
import transactionManagerStyles from '../../tiles/TransactionManager/TransactionManager.module.scss'
import ReactDOM from 'react-dom/client'
import { TutorialOverlay } from './TutorialOverlay/TutorialOverlay'
import { Dispatch, RefObject, SetStateAction } from 'react'
import { TileData } from '../../hooks'

export function triggerTutorial(
	tileData: TileData[],
	setTileData: (value: SetStateAction<TileData[]>) => void,
	tileContainerRef: RefObject<HTMLDivElement>
) {
	// first, make sure that the tiles are positioned properly for the tutorial.  temporarily create a "Simple Values" tile if one is not present already
	const tmTileIndex = tileData.findIndex((ti) => ti.type === 'transaction_manager')
	const prevTMTile = structuredClone(tileData[tmTileIndex])

	let svTileIndex = tileData.findIndex((ti) => ti.type === 'simple_values')
	let prevSVTile = svTileIndex === -1 ? undefined : structuredClone(tileData[svTileIndex])
	setTileData((prev) => {
		const clone = structuredClone(prev)
		clone[tmTileIndex].position = { top: 30, left: 30 }
		clone[tmTileIndex].size = { height: 690, width: 750 }
		if (svTileIndex === -1) {
			clone.push({
				type: 'simple_values',
				position: { top: 30, left: 810 },
				size: { height: 180, width: 240 },
				id: 'TEMP_TILE_FOR_TUTORIAL',
				zIndex: 100,
				options: {
					show: 'accounts',
					title: 'Current Account Balances',
					exclude: ['no_account'],
					customDay: '2025-01-19',
					showTitle: true,
					showDataFor: 'all_time',
				},
			})
			svTileIndex = clone.length - 1
		} else {
			clone[svTileIndex].position = { top: 30, left: 810 }
			clone[svTileIndex].size = { height: 180, width: 240 }
		}
		return clone
	})
	tileContainerRef.current!.parentElement!.scrollTop = 0
	tileContainerRef.current!.parentElement!.scrollLeft = 0

	const body = document.body
	const tutorialContainer = document.createElement('div')

	body.appendChild(tutorialContainer)
	const tutorialReactRoot = ReactDOM.createRoot(tutorialContainer)

	tutorialReactRoot.render(
		<TutorialOverlay
			close={() => {
				tutorialReactRoot.render(<></>)
				tutorialReactRoot.unmount()
				tutorialContainer.remove()

				// revert tileData changes
				setTileData((prev) => {
					const clone = structuredClone(prev)
					clone[tmTileIndex].position = prevTMTile.position
					clone[tmTileIndex].size = prevTMTile.size
					if (prevSVTile === undefined) {
						clone.splice(svTileIndex, 1)
					} else {
						clone[svTileIndex].position = prevSVTile.position
						clone[svTileIndex].size = prevSVTile.size
					}
					return clone
				})
			}}
		/>
	)
}
