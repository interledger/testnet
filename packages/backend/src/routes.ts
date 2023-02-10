import express from 'express'
import passport from 'passport'

export const mainRouter = express.Router()

mainRouter.post(
  '/protected',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    console.log(' a ajuns')
    console.log(req)
    res.status(200).json({ success: true })
  }
)
