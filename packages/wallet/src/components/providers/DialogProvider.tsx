import { DialogContext, dialogInitialState } from '@/lib/context/dialog'
import { DialogAction, DialogActions, DialogState } from '@/lib/types/dialog'
import { ReactNode, useReducer } from 'react'

type DialogProviderProps = {
  children: ReactNode
}

export const reducer = (
  state: DialogState,
  action: DialogAction
): DialogState => {
  switch (action.type) {
    case DialogActions.OPEN:
      return {
        ...state,
        open: action.open,
        dialog: action.data
      }
    case DialogActions.CLOSE: {
      return {
        ...state,
        open: action.open,
        dialog: action.data
      }
    }
  }
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [state, dispatch] = useReducer(reducer, dialogInitialState)

  const renderDialog = () => {
    if (!state.open) return null
    if (!state.dialog) return null

    const Dialog = state.dialog

    return <Dialog />
  }

  return (
    <DialogContext.Provider value={{ state, dispatch }}>
      {renderDialog()}
      {children}
    </DialogContext.Provider>
  )
}
