import { createContext } from 'react'
import { DialogDispatch, DialogState } from '../types/dialog'

type DialogContextType = {
  state: DialogState
  dispatch: DialogDispatch
}

export const dialogInitialState = {
  isOpen: false,
  dialog: null
} satisfies DialogState

export const DialogContext = createContext<DialogContextType>({
  state: dialogInitialState,
  dispatch: () => void 0
})
