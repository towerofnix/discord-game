// High-level prompt-based menu system.

const { temporaryPrompt } = require('./prompt')

async function showMenu(channel, userId, spec) {
  console.log('Gooo!~')

  let history = []

  const showDialog = async function(dialogId) {
    const dialog = spec.dialogs[dialogId]

    if ('action' in dialog) {
      await handleAction(dialog.action)
    }

    let options
    if ('options' in dialog) {
      if (Array.isArray(dialog.options)) {
        options = dialog.options
      } else if (dialog.options instanceof Function) {
        options = dialog.options()
      }
    }

    if (options) {
      const processedOptions = new Map(options.map(opt => {
        return [opt, [opt.title, opt.emoji]]
      }))

      const { choice } = await temporaryPrompt(channel, userId, dialog.title, processedOptions)

      if ('action' in choice) {
        await handleAction(choice.action)
      }
    }
  }

  const handleAction = async function(action) {
    if ('run' in action) {
      const nextAction = await action.run()

      if (nextAction) {
        await handleAction(nextAction)
      }
    }

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

  handleAction({to: spec.start})
}

module.exports = showMenu
