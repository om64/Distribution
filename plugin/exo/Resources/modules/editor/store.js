import {createStore as baseCreate, applyMiddleware} from 'redux'
import createLogger from 'redux-logger'
import {assert, createThunkMiddleware, startLoading, endLoading} from './util'

const loggerMiddleware = createLogger()
const thunkMiddleware = createThunkMiddleware()
const creators = {}



const handlers = {}



const choiceHandler = {
  name: "choice",
  type: "application/x.choice+json",
  reducer: (state, action) => state
}



export function addQuestionHandler(handler) {

}








export function addActionCreator(name, creator) {
  assert(!creators[name], `Action creator "${name}" is already registered`)
  assert(typeof creator === 'function', 'Action creator must be a function')
  creators[name] = creator
}

addActionCreator('addStep', () => {
  return dispatch => {
    return new Promise((resolve) => {
      startLoading()
      setTimeout(() => {
        resolve(dispatch({ type: 'ADD_STEP' }))
        endLoading()
      }, 1000)
    })
  }
})

addActionCreator('removeStep', stepId => {
  assert(stepId, "Step id is mandatory")

  return {
    type: 'REMOVE_STEP',
    stepId
  }
})



export function createStore(initialState) {
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'ADD_STEP':
        return [...state, { id: `tmp-${Date.now()}`, items: []}]
      case 'REMOVE_STEP':
        const step = state.find(step => step.id === action.stepId)
        const index = state.indexOf(step)
        return [...state.slice(0, index), ...state.slice(index + 1)]
      case 'ADD_ITEM':
        return [...state, { title: "New item!" }]
      default:
        return state
    }
  }

  return baseCreate(reducer, applyMiddleware(loggerMiddleware, thunkMiddleware))
}

export function controller(store) {
  this.dispatch = (creator, ...args) => {
    assert(creators[creator], `Action creator "${creator}" is not registered`)
    const action = creators[creator].apply(creators[creator], args)
    store.dispatch(action)
  }
}
