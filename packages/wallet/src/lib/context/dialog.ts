import { createContext } from 'react'
import { DialogDispatch, DialogState } from '../types/dialog'

type DialogContext = {
  state: DialogState
  dispatch: DialogDispatch
}

export const dialogInitialState = {
  isOpen: false,
  dialog: null
} satisfies DialogState

export const DialogContext = createContext<DialogContext>({
  state: dialogInitialState,
  dispatch: () => void 0
})
