import { createContext } from 'react'
import { DialogDispatch, DialogState } from '../types/dialog'

type DialogContext = {
  state: DialogState
  dispatch: DialogDispatch
}

export const dialogInitialState = {
  open: false,
  dialog: null
} satisfies DialogState

export const DialogContext = createContext<DialogContext>({
  state: dialogInitialState,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispatch: () => {}
})
