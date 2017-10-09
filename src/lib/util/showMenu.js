// High-level prompt-based menu system.

const { temporaryPrompt, parseChoiceText } = require('./prompt')

async function evaluateProperty(obj, prop) {
  if (prop in obj) {
    if (obj[prop] instanceof Function) {
      return obj[prop]()
    } else {
      return obj[prop]
    }
  } else {
    return undefined
  }
}

async function showMenu(channel, userId, spec) {
  let history = []

  const showDialog = async function(dialogId, autoInput = '') {
    const dialog = spec.dialogs[dialogId]

    const dialogAction = await evaluateProperty(dialog, 'action')

    if (dialogAction) {
      await handleAction(dialogAction)
    }

    const options = await evaluateProperty(dialog, 'options')

    if (options) {
      let choice = null, rest = ''

      if (autoInput.length > 0) {
        console.log('Waahoa!!', autoInput)

        const match = parseChoiceText(autoInput, options)
        if (match) {
          choice = match.choice
          rest = match.rest
        }
      }

      if (choice === null) {
        const title = await evaluateProperty(dialog, 'title')

        const match = await temporaryPrompt(channel, userId, title, options)
        choice = match.choice
        rest = match.rest
      }

      const action = await evaluateProperty(choice, 'action')

      if (action) {
        await handleAction(action, rest)
      }
    }
  }

  const handleAction = async function(action, autoInput) {
    if ('to' in action) {
      history.push(action.to)
      await showDialog(action.to, autoInput)
    }

    if ('history' in action) {
      const current = history.pop()
      const previous = history.pop()
      if (previous) {
        history.push(previous)
        await showDialog(previous, autoInput)
      }
    }
  }

  await handleAction({to: spec.start})
}

module.exports = showMenu
