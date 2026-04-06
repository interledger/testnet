import type { Dispatch, ReactNode } from 'react'

export type DialogProps = {
  title?: string
  content: ReactNode
  onClose: () => void
}

export type DialogState = {
  isOpen: boolean
  dialog: JSX.Element | null
}
export type DialogActions = 'OPEN' | 'CLOSE'
export type OpenDialogAction = {
  type: DialogActions
  data: {
    isOpen: boolean
    dialog: JSX.Element
  }
}
export type CloseDialogAction = {
  type: DialogActions
  data: {
    isOpen: boolean
    dialog: null
  }
}
export type DialogAction = OpenDialogAction | CloseDialogAction
export type DialogDispatch = Dispatch<DialogAction>
