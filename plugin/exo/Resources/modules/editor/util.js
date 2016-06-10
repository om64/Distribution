import nprogress from 'nprogress/nprogress'

nprogress.configure({ parent: '.section-content' })

let loadingQueue = 0

export function assert(test, message) {
  if (!message) {
    throw new Error('An assertion failure message is required')
  }

  if (!test) {
    const error = new Error(message)
    error.name = 'Assertion failure'
    throw error
  }
}

export function createThunkMiddleware() {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState)
    }

    return next(action)
  }
}

export function startLoading() {
  if (++loadingQueue === 1) {
    nprogress.start()
  }
}

export function endLoading() {
  if (--loadingQueue == 0) {
    nprogress.done()
  } else {
    nprogress.inc()
  }
}
