import React, { useEffect, useRef, useState } from 'react'
import { DialogProps } from '@material-ui/core/Dialog'
import { GenericContent } from '@sensenet/default-content-types'
import {
  Button,
  createStyles,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import NoteAddSharpIcon from '@material-ui/icons/NoteAddSharp'
import { useRepository } from '@sensenet/hooks-react'
import { ObservableValue } from '@sensenet/client-utils'
import { UploadProgressInfo } from '@sensenet/client-core'
import { DropFileArea } from '../../DropFileArea'
import { FileList } from './file-list'
import { FileWithFullPath, getFilesFromDragEvent } from './helper'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
    icon: {
      fontSize: '4rem',
    },
    grid: {
      height: '85vh',
      border: 'dashed',
      borderColor: theme.palette.grey[500],
      marginBottom: theme.spacing(2),
      overflowY: 'auto',
    },
    body1: {
      fontSize: '2.5rem',
    },
    body2: {
      fontSize: '2rem',
    },
  }),
)

type Props = {
  dialogProps: DialogProps
  content: GenericContent
  files?: File[]
}

export const UploadDialog: React.FunctionComponent<Props> = props => {
  const classes = useStyles()
  const repository = useRepository()
  const inputFile = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileWithFullPath[]>()
  const [isUploadInProgress, setIsUploadInProgress] = useState(false)
  const [progressObservable] = useState(new ObservableValue<UploadProgressInfo>())

  useEffect(() => {
    setFiles(props.files)
  }, [props.files])

  useEffect(() => {
    const disposable = progressObservable.subscribe(progressInfo => {
      if (!files) {
        return
      }

      setFiles(
        files.map(f => {
          if (f.lastModified === progressInfo.file.lastModified) {
            const updated = Object.assign(f, { progress: progressInfo })
            return updated
          }
          return f
        }),
      )
    })
    return () => disposable.dispose()
  }, [files, progressObservable])

  useEffect(() => {
    const handleBeforeunload = (event: BeforeUnloadEvent) => {
      if (isUploadInProgress) {
        event.preventDefault()
        event.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeunload)
    return () => window.removeEventListener('beforeunload', handleBeforeunload)
  }, [isUploadInProgress])

  const isFileAdded = files && !!files.length

  const removeItem = (file: File) => {
    if (!files) {
      return
    }
    setFiles(files.filter(f => f !== file))
  }

  const addFiles = (fileList: FileWithFullPath[]) => {
    const noDuplicateFiles =
      files && files.length
        ? [...files, ...fileList.filter(file => !files.some(f2 => f2.size === file.size && f2.name === file.name))]
        : fileList
    setFiles(noDuplicateFiles)
  }

  const isUploadCompleted = () => {
    return (
      files &&
      files.length &&
      files.every(file => {
        return file.progress && (file.progress.completed || file.progress.error)
      })
    )
  }

  const onDrop = async (event: React.DragEvent) => {
    if (isUploadInProgress || isUploadCompleted()) {
      return
    }
    const result = await getFilesFromDragEvent(event)
    addFiles(result)
  }

  const upload = async () => {
    if (!files) {
      return
    }
    setIsUploadInProgress(true)

    try {
      await repository.upload.fromFileList({
        parentPath: props.content.Path,
        fileList: files as any,
        createFolders: true,
        binaryPropertyName: 'Binary',
        overwrite: false,
        progressObservable,
      })
    } catch (error) {
      // TODO: log with logger?
      console.log(error.message)
    } finally {
      setIsUploadInProgress(false)
    }
  }

  return (
    <Dialog {...props.dialogProps} disablePortal fullScreen>
      <DialogTitle disableTypography>
        <Typography variant="h6" align="center">
          Upload files
        </Typography>
        {props.dialogProps.onClose ? (
          <IconButton
            disabled={isUploadInProgress}
            aria-label="close"
            className={classes.closeButton}
            onClick={() => props.dialogProps.onClose && props.dialogProps.onClose({}, 'escapeKeyDown')}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <DropFileArea parentContent={props.content} onDrop={onDrop}>
          <Grid
            onClick={() => {
              if (isUploadInProgress || isUploadCompleted()) {
                return
              }
              inputFile.current && inputFile.current.click()
            }}
            container
            justify={isFileAdded ? 'flex-start' : 'center'}
            direction="column"
            alignItems={isFileAdded ? 'stretch' : 'center'}
            className={classes.grid}>
            {isFileAdded ? (
              <FileList files={files!} removeItem={removeItem} isUploadInProgress={isUploadInProgress} />
            ) : (
              <>
                <NoteAddSharpIcon className={classes.icon} />
                <Typography variant="body1" className={classes.body1}>
                  Select files to upload
                </Typography>
                <Typography variant="body2" className={classes.body2}>
                  or drag and drop
                </Typography>
              </>
            )}
          </Grid>
        </DropFileArea>
        <Grid container justify="flex-end">
          {isUploadCompleted() ? null : (
            <Button color="primary" disabled={isUploadInProgress} variant="contained" onClick={() => upload()}>
              Upload
            </Button>
          )}
        </Grid>
      </DialogContent>
      <input
        onChange={ev => ev.target.files && addFiles([...ev.target.files])}
        style={{ display: 'none' }}
        ref={inputFile}
        type="file"
        accept=""
        multiple={true}
      />
    </Dialog>
  )
}
