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

  const showBack = await evaluateProperty(spec, 'showBack')

  const showDialog = async function(dialogId, { autoInput = '', pageIndex = 0 } = {}) {
    const dialog = spec.dialogs[dialogId]

    // Dialogs may automatically run a given action when they activate.

    const dialogAction = await evaluateProperty(dialog, 'action')
    if (dialogAction) {
      await handleAction(dialogAction)
    }

    // Handle auto-input. Auto-input should consider all options, regardless of
    // regardless of what page they show up on, if the dialog has multiple pages.

    const allOptions = []

    const options = await evaluateProperty(dialog, 'options')

    if (options) {
      allOptions.push(...options)
    }

    const pages = await evaluateProperty(dialog, 'pages')

    if (pages) {
      for (const page of pages) {
        allOptions.push(...page)
      }
    }

    let choice = null, rest = ''

    if (autoInput.length > 0) {
      const match = parseChoiceText(autoInput, allOptions)
      if (match) {
        choice = match.choice
        rest = match.rest
      }
    }

    // If auto-input found no choice, then pass control back to the user.

    if (choice === null) {

      // Get rendered options (the buttons displayed below the temporary prompt).

      const renderedOptions = []

      // Show the back button, if the menu is configured to show it, and there is
      // history to go back to.

      if (showBack === true && history.length > 1) {
        renderedOptions.push({title: 'Back', emoji: '⏪', action: {history: 'back'}})
      }

      // Show the actual options array.

      if (options) {
        renderedOptions.push(...options)
      }

      // If the dialog is multipage, show page navigation controls and the options
      // for the current page.
      //
      // Note that we don't add the new page to the history array; this is so that
      // pressing the back button (if visible) will take the user away from the
      // multipage prompt, which practically acts as one dialog.

      if (pages) {
        if (pageIndex > 0) {
          renderedOptions.push({title: 'Previous page', emoji: '◀', action: async () => {
            await showDialog(dialogId, { pageIndex: pageIndex - 1 })
          }})
        }

        const currentPage = pages[pageIndex]

        if (currentPage) {
          renderedOptions.push(...currentPage)
        }

        if (pageIndex < pages.length - 1) {
          renderedOptions.push({title: 'Next page', emoji: '▶', action: async () => {
            await showDialog(dialogId, { pageIndex: pageIndex + 1 })
          }})
        }
      }

      const title = await evaluateProperty(dialog, 'title')
      const match = await temporaryPrompt(channel, userId, title, renderedOptions)

      choice = match.choice
      rest = match.rest
    }

    // If the selected option has an action, run it.

    const action = await evaluateProperty(choice, 'action')

    if (action) {
      await handleAction(action, rest)
    }
  }

  const handleAction = async function(action, autoInput) {
    if ('to' in action) {
      history.push(action.to)
      await showDialog(action.to, {autoInput})
    }

    if ('history' in action) {
      const current = history.pop()
      const previous = history.pop()
      if (previous) {
        history.push(previous)
        await showDialog(previous, {autoInput})
      }
    }
  }

  await handleAction({to: spec.start})
}

module.exports = showMenu
