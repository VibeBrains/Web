/** How long the copy button says the command is copied */
const COPIED_MS = 1800

/**
 * Copy buttons next to commands
 * Button captions come from data attributes filled from the catalog, so no interface string lives here
 */
export const initCopy = (): void => {
  document.querySelectorAll<HTMLElement>('[data-copy-root]').forEach((root) => {
    const command = root.querySelector<HTMLElement>('[data-copy-command]')
    const button = root.querySelector<HTMLButtonElement>('[data-copy-button]')
    if (command === null || button === null) return

    let timer: number | undefined
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(command.textContent ?? '')
      } catch {
        // Clipboard can be denied: select the command so the visitor copies it by hand
        const range = document.createRange()
        range.selectNodeContents(command)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
        return
      }
      button.textContent = button.dataset.copied ?? ''
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        button.textContent = button.dataset.copy ?? ''
      }, COPIED_MS)
    })
  })
}
