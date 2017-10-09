// High-level prompt-based menu system.

const { temporaryPrompt } = require('./prompt')

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

  const showDialog = async function(dialogId) {
    const dialog = spec.dialogs[dialogId]

    const dialogAction = await evaluateProperty(dialog, 'action')

    if (dialogAction) {
      await handleAction(dialogAction)
    }

    const options = await evaluateProperty(dialog, 'options')

    if (options) {
      const processedOptions = new Map(options.map(opt => {
        return [opt, [opt.title, opt.emoji]]
      }))

      const title = await evaluateProperty(dialog, 'title')

      const { choice } = await temporaryPrompt(channel, userId, title, processedOptions)

      const action = await evaluateProperty(choice, 'action')

      if (action) {
        await handleAction(action)
      }
    }
  }

  const handleAction = async function(action) {
    if ('to' in action) {
      history.push(action.to)
      await showDialog(action.to)
    }

    if ('history' in action) {
      const current = history.pop()
      const previous = history.pop()
      if (previous) {
        history.push(previous)
        await showDialog(previous)
      }
    }
  }

  await handleAction({to: spec.start})
}

module.exports = showMenu
