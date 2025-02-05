<script>
export const downloadScreenshot = async () => {
  try {
    const searchBox = document.querySelector('#search')
    if (!searchBox) {
      console.error("Search box not found")
      return
    }

    const searchText = searchBox.value
    if (!searchText) {
      console.error("No text found in search box")
      return
    }
    const charWidth = 23 
    const canvasHeight = 50
    const canvasWidth = (charWidth * searchText.length)+9

    const tempCanvas = document.createElement('canvas')
    const context = tempCanvas.getContext('2d')
    tempCanvas.width = canvasWidth//searchBox.offsetWidth
    tempCanvas.height = canvasHeight//searchBox.offsetHeight

    const computedStyles = getComputedStyle(searchBox)
    context.font = computedStyles.font
    context.textAlign = computedStyles.textAlign
    context.textBaseline = 'top'
    context.fillStyle = computedStyles.color

    context.fillText(searchText, 9, 9, canvasWidth)

    tempCanvas.toBlob((blob) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'screenshot.png'
      link.click()
      URL.revokeObjectURL(link.href)
    }, 'image/png')
  } catch (err) {
    console.error('Error capturing screenshot:', err)
  }
}

export const copyScreenshotToClipboard = async () => {
  try {
    const searchBox = document.querySelector('#search')
    if (!searchBox) {
      console.error("Search box not found")
      return
    }

    const searchText = searchBox.value
    // console.log("searchText", searchText)
    // console.log("Length of searchText:", searchText.length)
    if (!searchText) {
      console.error("No text found in search box")
      return
    }

    const charWidth = 23 
    const canvasHeight = 50
    const canvasWidth = (charWidth * searchText.length)+9

    const tempCanvas = document.createElement('canvas')
    console.log("tempCanvas", tempCanvas)
    const context = tempCanvas.getContext('2d')
    tempCanvas.width = canvasWidth
    tempCanvas.height = canvasHeight

    const computedStyles = getComputedStyle(searchBox)
    context.font = computedStyles.font
    context.textAlign = computedStyles.textAlign
    context.textBaseline = 'top'
    context.fillStyle = computedStyles.color

    context.fillText(searchText, 9, 9, canvasWidth)

    tempCanvas.toBlob(async (blob) => {
      try {
        const clipboardItem = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([clipboardItem])
        console.log('Screenshot copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy screenshot', err)
      }
    }, 'image/png')
  } catch (err) {
    console.error('Error capturing screenshot:', err)
  }
}
</script>
