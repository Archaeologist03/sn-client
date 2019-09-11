import React, { useCallback, useEffect, useState } from 'react'
import {
  Annotation,
  CommentData,
  DraftCommentMarker,
  Highlight,
  PreviewImageData,
  Redaction,
  Shape,
  Shapes,
} from '../../models'
import { Dimensions } from '../../services'
import { useComments, useDocumentData, useDocumentPermissions, useViewerState } from '../../hooks'
import { ShapeAnnotation, ShapeHighlight, ShapeRedaction } from './Shape'
import { CommentMarker, ShapesContainer } from './style'

/**
 * Defined the component's own properties
 */
export interface ShapesWidgetProps {
  viewPort: Dimensions
  page: PreviewImageData
  zoomRatio: number
  draftCommentMarker?: DraftCommentMarker
}

/**
 * Page widget component for displaying shapes on a page
 */
export const ShapesWidget: React.FC<ShapesWidgetProps> = props => {
  const permissions = useDocumentPermissions()
  const viewerState = useViewerState()
  const docData = useDocumentData()
  const comments = useComments()

  const [shapes, setShapes] = useState({
    redactions: docData.shapes.redactions.filter(r => r.imageIndex === props.page.Index) as Redaction[],
    highlights: docData.shapes.highlights.filter(r => r.imageIndex === props.page.Index) as Highlight[],
    annotations: docData.shapes.annotations.filter(r => r.imageIndex === props.page.Index) as Annotation[],
  })

  useEffect(() => {
    setShapes({
      redactions: docData.shapes.redactions.filter(r => r.imageIndex === props.page.Index) as Redaction[],
      highlights: docData.shapes.highlights.filter(r => r.imageIndex === props.page.Index) as Highlight[],
      annotations: docData.shapes.annotations.filter(r => r.imageIndex === props.page.Index) as Annotation[],
    })
  }, [docData.shapes.annotations, docData.shapes.highlights, docData.shapes.redactions, props.page.Index])

  const [commentMarkers] = useState<CommentData[]>([])

  const updateShapeData = useCallback((..._args: any[]) => {
    //ToDo
  }, [])

  const onDrop = useCallback(
    (ev: React.DragEvent<HTMLElement>, page: PreviewImageData) => {
      if (permissions.canEdit) {
        ev.preventDefault()
        const shapeData = JSON.parse(ev.dataTransfer.getData('shape')) as {
          type: keyof Shapes
          shape: Shape
          offset: Dimensions
        }
        const boundingBox = ev.currentTarget.getBoundingClientRect()
        updateShapeData(shapeData.type, shapeData.shape.guid, {
          ...shapeData.shape,
          imageIndex: page.Index,
          x: (ev.clientX - boundingBox.left - shapeData.offset.width) * (1 / props.zoomRatio),
          y: (ev.clientY - boundingBox.top - shapeData.offset.height) * (1 / props.zoomRatio),
        })
      }
    },
    [permissions.canEdit, props.zoomRatio, updateShapeData],
  )
  return (
    <ShapesContainer>
      {viewerState.showComments &&
        commentMarkers.map(marker => (
          <CommentMarker
            onClick={() => comments.setActiveComment(marker.id)}
            isSelected={marker.id === comments.activeCommentId}
            zoomRatio={props.zoomRatio}
            marker={marker}
            key={marker.id}
          />
        ))}
      <div onDrop={ev => onDrop(ev, props.page)} onDragOver={ev => ev.preventDefault()}>
        {permissions.canHideRedaction &&
          viewerState.showRedaction &&
          shapes.redactions.map((redaction, index) => {
            return (
              <ShapeRedaction
                shapeType="redactions"
                shape={redaction}
                canEdit={permissions.canEdit}
                zoomRatio={props.zoomRatio}
                key={index}
              />
            )
          })}

        {viewerState.showShapes &&
          shapes.annotations.map((annotation, index) => {
            return (
              <ShapeAnnotation
                shapeType="annotations"
                shape={annotation}
                canEdit={permissions.canEdit}
                zoomRatio={props.zoomRatio}
                key={index}
              />
            )
          })}

        {viewerState.showShapes &&
          shapes.highlights.map((highlight, index) => {
            return (
              <ShapeHighlight
                shapeType="highlights"
                shape={highlight}
                canEdit={permissions.canEdit}
                zoomRatio={props.zoomRatio}
                key={index}
              />
            )
          })}
      </div>
    </ShapesContainer>
  )
}
