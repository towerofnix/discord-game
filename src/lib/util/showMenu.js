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

    const processedOptions = new Map(dialog.options.map(opt => {
      return [opt, [opt.title, opt.emoji]]
    }))

    const { choice } = await temporaryPrompt(channel, userId, dialog.title, processedOptions)

    if ('action' in choice) {
      await handleAction(choice.action)
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
  }

  showDialog(spec.start)
}

module.exports = showMenu
