import React, { useRef, useState } from 'react'
import { DialogProps } from '@material-ui/core/Dialog'
import { GenericContent } from '@sensenet/default-content-types'
import {
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
import { DropFileArea } from '../../DropFileArea'
import { FileList } from './file-list'

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
      minHeight: '90vh',
      border: 'dashed',
      borderColor: theme.palette.grey[500],
    },
    body1: {
      fontSize: '2.5rem',
    },
    body2: {
      fontSize: '2rem',
    },
  }),
)

export const UploadDialog: React.FunctionComponent<{
  dialogProps: DialogProps
  content: GenericContent
}> = props => {
  const classes = useStyles()
  const inputFile = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>()

  const isFileAdded = files && !!files.length

  const removeItem = (file: File) => {
    if (!files) {
      return
    }
    setFiles(files.filter(f => f !== file))
  }

  return (
    <Dialog {...props.dialogProps} disablePortal fullScreen>
      <DialogTitle disableTypography>
        <Typography variant="h6" align="center">
          Upload files
        </Typography>
        {props.dialogProps.onClose ? (
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={() => props.dialogProps.onClose && props.dialogProps.onClose({}, 'escapeKeyDown')}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <DropFileArea
          parentContent={props.content}
          onDrop={ev =>
            files ? setFiles([...files, ...ev.dataTransfer.files]) : setFiles([...ev.dataTransfer.files])
          }>
          <Grid
            onClick={() => inputFile.current && inputFile.current.click()}
            container
            justify={isFileAdded ? 'flex-start' : 'center'}
            direction="column"
            alignItems={isFileAdded ? 'stretch' : 'center'}
            className={classes.grid}>
            {isFileAdded ? (
              <FileList files={files!} removeItem={removeItem} />
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
      </DialogContent>
      <input
        onChange={ev => (files ? setFiles([...files, ...ev.target.files!]) : setFiles([...ev.target.files!]))}
        style={{ display: 'none' }}
        ref={inputFile}
        type="file"
        accept=""
        multiple={true}
      />
    </Dialog>
  )
}
