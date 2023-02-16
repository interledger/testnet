import { DialogContext, dialogInitialState } from '@/lib/context/dialog'
import { DialogAction, DialogState } from '@/lib/types/dialog'
import { ReactNode, useReducer } from 'react'

type DialogProviderProps = {
  children: ReactNode
}

export const reducer = (
  state: DialogState,
  action: DialogAction
): DialogState => {
  switch (action.type) {
    case 'OPEN':
      return {
        ...state,
        isOpen: action.data.isOpen,
        dialog: action.data.dialog
      }
    case 'CLOSE': {
      return {
        ...state,
        isOpen: action.data.isOpen,
        dialog: action.data.dialog
      }
    }
  }
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [state, dispatch] = useReducer(reducer, dialogInitialState)

  const Dialog = () => {
    if (!state.isOpen) return null
    if (!state.dialog) return null

    return state.dialog
  }

  return (
    <DialogContext.Provider value={{ state, dispatch }}>
      <Dialog />
      {children}
    </DialogContext.Provider>
  )
}
