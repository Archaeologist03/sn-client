import React, { useCallback, useEffect, useState } from 'react'
import { deepMerge, DeepPartial } from '@sensenet/client-utils'
import { ViewerState } from '../models/viewer-state'

export const defaultViewerState: ViewerState & { updateState: (newState: DeepPartial<ViewerState>) => void } = {
  activePages: [1],
  zoomMode: 'fit',
  customZoomLevel: 3,
  showWatermark: false,
  showRedaction: true,
  showShapes: true,
  showThumbnails: false,
  fitRelativeZoomLevel: 0,
  showComments: false,
  updateState: () => {
    /** */
  },
}
export const ViewerStateContext = React.createContext(defaultViewerState)

export const ViewerStateProvider: React.FC<{ options?: Partial<ViewerState> }> = props => {
  const [state, setState] = useState<ViewerState>(deepMerge({ ...defaultViewerState }, props.options))

  useEffect(() => {
    setState(deepMerge({ ...defaultViewerState }, props.options))
  }, [props.options])

  const updateState = useCallback((newState: DeepPartial<ViewerState>) => {
    setState(deepMerge({ ...state }, newState))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <ViewerStateContext.Provider value={{ ...state, updateState }}>{props.children}</ViewerStateContext.Provider>
}
