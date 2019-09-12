import Drawer from '@material-ui/core/Drawer'
import { SlideProps } from '@material-ui/core/Slide'
import Typography from '@material-ui/core/Typography'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DraftCommentMarker } from '../models'
import {
  useCommentDraft,
  useComments,
  useDocumentData,
  useDocumentViewerApi,
  useLocalization,
  useViewerState,
} from '../hooks'
import { CommentsContext, CommentsContextProvider } from '../context/comments'
import { Comment } from './comment'
import { CreateComment } from './comment/CreateComment'
import { CommentsContainer, PageList } from './'

/** Props definition for the Document Viewer layout */
export interface DocumentViewerLayoutProps {
  drawerSlideProps?: Partial<SlideProps>
}

/** State type definition for the DocumentViewerLayout component */
export interface DocumentLayoutState {
  draftCommentMarker?: DraftCommentMarker
  activePage?: number
  thumbnaislVisibility: boolean
  createCommentValue: string
}

const THUMBNAIL_PADDING = 16
const THUMBNAIL_NAME = 'Thumbnail'
const PAGE_PADDING = 8
const PAGE_NAME = 'Page'

interface ScrollToOptions {
  containerId: string
  index: number
  itemName: string
  padding: number
  smoothScroll: boolean
}

export const DocumentViewerLayout: React.FC<DocumentViewerLayoutProps> = props => {
  const viewerState = useViewerState()
  const localization = useLocalization()
  const api = useDocumentViewerApi()
  const docData = useDocumentData()

  const [createCommentValue, setCreateCommentValue] = useState('')

  const commentsContainerRef = useRef<HTMLDivElement>()
  const comments = useComments()
  const commentDraft = useCommentDraft()

  const handleKeyUp = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') {
        return
      }
      if (viewerState.isPlacingCommentMarker) {
        return viewerState.updateState({ isPlacingCommentMarker: false })
      }
      if (viewerState.isCreateCommentActive) {
        viewerState.updateState({ isCreateCommentActive: false })
      }
      comments.setActiveComment(undefined)
      setCreateCommentValue('')
    },
    [comments, viewerState],
  )

  useEffect(() => {
    document.addEventListener('keyup', handleKeyUp)
    return () => document.removeEventListener('keyup', handleKeyUp)
  }, [handleKeyUp])

  const scrollToImage = useCallback(({ containerId, index, itemName, padding, smoothScroll }: ScrollToOptions) => {
    const container = document.getElementById(containerId)
    const item = document.querySelector(`.${itemName}`)
    if (container && container.scrollTo && item) {
      container.scrollTo({
        top: (item.clientHeight + padding * 4) * (index - 1),
        behavior: smoothScroll ? 'smooth' : 'auto',
      })
    }
  }, [])

  const scrollTo = useCallback(
    (index: number, smoothScroll = true) => {
      viewerState.updateState({ activePages: [index] })
      scrollToImage({
        containerId: 'sn-document-viewer-pages',
        itemName: PAGE_NAME,
        padding: PAGE_PADDING,
        index,
        smoothScroll,
      })

      scrollToImage({
        containerId: 'sn-document-viewer-thumbnails',
        itemName: THUMBNAIL_NAME,
        padding: THUMBNAIL_PADDING,
        index,
        smoothScroll,
      })
    },
    [scrollToImage, viewerState],
  )

  const createComment = useCallback(
    (text: string) => {
      if (!commentDraft.draft || !viewerState.activePages[0] || !viewerState.activePages[0]) {
        return
      }
      api.commentActions.addPreviewComment({
        document: docData,
        comment: { ...commentDraft.draft, text, page: viewerState.activePages[0] },
        abortController: new AbortController(),
      })
      viewerState.updateState({ isPlacingCommentMarker: false })
    },
    [api.commentActions, commentDraft.draft, docData, viewerState],
  )

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      {props.children}
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          zIndex: 0,
          position: 'relative',
        }}>
        <Drawer
          variant={'persistent'}
          open={viewerState.showThumbnails}
          anchor="left"
          SlideProps={props.drawerSlideProps}
          PaperProps={{
            style: {
              position: 'relative',
              width: viewerState.showThumbnails ? '200px' : 0,
              height: '100%',
              overflow: 'hidden',
            },
          }}>
          <PageList
            showWidgets={false}
            style={{ minWidth: 200, marginRight: '-16px', paddingRight: 0 }}
            id="sn-document-viewer-thumbnails"
            zoomMode="fit"
            fitRelativeZoomLevel={0}
            zoomLevel={1}
            onPageClick={(_ev, index) => scrollTo(index)}
            elementName={THUMBNAIL_NAME}
            images="thumbnail"
            tolerance={0}
            padding={THUMBNAIL_PADDING}
            activePage={viewerState.activePages[0]}
          />
        </Drawer>
        <PageList
          showWidgets={true}
          id="sn-document-viewer-pages"
          zoomMode={viewerState.zoomMode}
          zoomLevel={viewerState.customZoomLevel}
          fitRelativeZoomLevel={viewerState.fitRelativeZoomLevel}
          onPageClick={(_ev, index) => scrollTo(index)}
          elementName={PAGE_NAME}
          images="preview"
          tolerance={0}
          padding={PAGE_PADDING}
          activePage={viewerState.activePages[0]}
        />
        <Drawer
          variant={'persistent'}
          open={viewerState.showComments}
          anchor="right"
          SlideProps={props.drawerSlideProps}
          PaperProps={{
            style: {
              position: 'relative',
              width: viewerState.showComments ? '340px' : 0,
              height: '100%',
              overflow: 'hidden',
            },
          }}>
          <CommentsContextProvider page={viewerState.activePages[0]}>
            <CommentsContainer ref={commentsContainerRef as any}>
              <Typography variant="h4">{localization.commentSideBarTitle}</Typography>
              <CreateComment
                isActive={viewerState.isCreateCommentActive}
                handleIsActive={isActive => viewerState.updateState({ isCreateCommentActive: isActive })}
                localization={localization}
                createComment={createComment}
                inputValue={createCommentValue}
                handleInputValueChange={value => setCreateCommentValue(value)}
              />

              <CommentsContext.Consumer>
                {commentsContext =>
                  commentsContext.comments.map(comment => <Comment key={comment.id} comment={comment} />)
                }
              </CommentsContext.Consumer>
            </CommentsContainer>
          </CommentsContextProvider>
        </Drawer>
      </div>
    </div>
  )
}
