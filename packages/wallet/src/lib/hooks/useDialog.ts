import { type FC, useContext } from 'react'
import { DialogContext } from '../context/dialog'
import { DialogActions } from '../types/dialog'

export const useDialog = () => {
  const { dispatch } = useContext(DialogContext)

  const openDialog = (data: FC) =>
    dispatch({
      type: DialogActions.OPEN,
      open: true,
      data
    })

  const closeDialog = () =>
    dispatch({
      type: DialogActions.CLOSE,
      open: false,
      data: null
    })

  return { openDialog, closeDialog }
}
