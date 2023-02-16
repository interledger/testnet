import type { Dispatch, FC } from 'react'

export type DialogState = {
  open: boolean
  dialog: FC | null
}
export enum DialogActions {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE'
}
export type OpenDialogAction = {
  type: DialogActions.OPEN
  open: boolean
  data: FC
}
export type CloseDialogAction = {
  type: DialogActions.CLOSE
  open: boolean
  data: null
}
export type DialogAction = OpenDialogAction | CloseDialogAction
export type DialogDispatch = Dispatch<DialogAction>
