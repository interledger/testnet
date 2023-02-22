import { useContext } from 'react'
import { DialogContext } from '../context/dialog'

export const useDialog = () => {
  const { dispatch } = useContext(DialogContext)

  const openDialog = (dialog: JSX.Element) =>
    dispatch({
      type: 'OPEN',
      data: {
        isOpen: true,
        dialog
      }
    })

  const closeDialog = () =>
    dispatch({
      type: 'CLOSE',
      data: {
        isOpen: false,
        dialog: null
      }
    })

  return { openDialog, closeDialog }
}
