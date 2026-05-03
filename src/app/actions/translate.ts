'use server'

export async function translateGreekToEnglish(text: string): Promise<string> {
  if (!text.trim()) return ''

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=el|en`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Translation service unavailable')

  const data = await res.json()
  const translated: string = data?.responseData?.translatedText

  if (!translated) throw new Error('No translation returned')
  return translated
}
