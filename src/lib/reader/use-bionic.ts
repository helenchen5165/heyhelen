export function bionicHTML(text: string): string {
  if (!text) return ''

  return text.replace(/[a-zA-Z]+/g, (word) => {
    const len = word.length
    let boldCount: number
    if (len <= 3) {
      boldCount = 1
    } else if (len <= 6) {
      boldCount = 2
    } else if (len <= 9) {
      boldCount = 3
    } else {
      boldCount = Math.floor(len * 0.40)
    }
    return `<b>${word.slice(0, boldCount)}</b>${word.slice(boldCount)}`
  })
}
