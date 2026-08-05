export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = { ...options.headers as Record<string, string> }
  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  const json = await res.json()

  if (!json.success) {
    throw new Error(json.error || '请求失败')
  }

  return json.data
}

export async function apiUpload<T = any>(
  url: string,
  formData: FormData
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const json = await res.json()

  if (!json.success) {
    throw new Error(json.error || '上传失败')
  }

  return json.data
}
