

export const ensureAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next()
  }

  // every route using this is an api call, so tell the frontend instead of redirecting
  res.status(401).json({ error: "Please log in first" })
}
