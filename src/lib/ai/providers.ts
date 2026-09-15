/**
 * Direct, in-browser calls to a hosted model with the user's own API key.
 *
 * Nothing goes through a Flow server: the request leaves the browser for the
 * provider the user picked. Anthropic goes through the official SDK; every
 * other provider speaks the OpenAI chat-completions dialect, which OpenAI,
 * OpenRouter, xAI and most self-hosted servers (Ollama, LM Studio, vLLM…) share.
 */
import type Anthropic from '@anthropic-ai/sdk'

export type AiProviderId = 'anthropic' | 'openai' | 'openrouter' | 'xai' | 'custom'

export interface AiSettings {
  provider: AiProviderId
  apiKey: string
  model: string
  /** OpenAI-compatible base URL, used by the `custom` provider only. */
  baseUrl: string
  /** Keep the key in localStorage between visits (otherwise it lives in memory only). */
  rememberKey: boolean
}

export interface AiProviderInfo {
  id: AiProviderId
  label: string
  defaultModel: string
  /** Chat-completions base URL (the `/chat/completions` suffix is appended). */
  baseUrl?: string
  keysUrl?: string
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    defaultModel: 'claude-opus-5',
    keysUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-5',
    baseUrl: 'https://api.openai.com/v1',
    keysUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultModel: 'anthropic/claude-opus-5',
    baseUrl: 'https://openrouter.ai/api/v1',
    keysUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'xai',
    label: 'xAI (Grok)',
    defaultModel: 'grok-4',
    baseUrl: 'https://api.x.ai/v1',
    keysUrl: 'https://console.x.ai',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    defaultModel: '',
    baseUrl: 'http://localhost:11434/v1',
  },
]

export function providerInfo(id: AiProviderId): AiProviderInfo {
  return AI_PROVIDERS.find((provider) => provider.id === id) ?? AI_PROVIDERS[0]
}

const SETTINGS_KEY = 'wf:ai-settings'
const KEY_KEY = 'wf:ai-key'

export const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: 'anthropic',
  apiKey: '',
  model: 'claude-opus-5',
  baseUrl: 'http://localhost:11434/v1',
  rememberKey: true,
}

// The key survives a dialog close even when it is not persisted to disk.
let sessionKey = ''

export function loadAiSettings(): AiSettings {
  let stored: Partial<AiSettings> = {}
  let storedKey = ''
  try {
    stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<AiSettings>
    storedKey = localStorage.getItem(KEY_KEY) ?? ''
  } catch {
    // storage blocked: fall back to defaults
  }
  const provider = AI_PROVIDERS.some((p) => p.id === stored.provider)
    ? (stored.provider as AiProviderId)
    : DEFAULT_AI_SETTINGS.provider
  return {
    provider,
    model: typeof stored.model === 'string' ? stored.model : providerInfo(provider).defaultModel,
    baseUrl: typeof stored.baseUrl === 'string' ? stored.baseUrl : DEFAULT_AI_SETTINGS.baseUrl,
    rememberKey: stored.rememberKey !== false,
    apiKey: storedKey || sessionKey,
  }
}

export function saveAiSettings(settings: AiSettings) {
  sessionKey = settings.apiKey
  try {
    const { apiKey, ...rest } = settings
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest))
    if (settings.rememberKey && apiKey) localStorage.setItem(KEY_KEY, apiKey)
    else localStorage.removeItem(KEY_KEY)
  } catch {
    // storage blocked: the in-memory copy still works for this visit
  }
}

export interface ModelCallOptions {
  settings: AiSettings
  system: string
  user: string
  signal?: AbortSignal
  /** Called with the number of characters received so far while streaming. */
  onProgress?: (chars: number) => void
}

export class ModelCallError extends Error {}

/** Ask the configured model and return its full text response. */
export async function callModel(options: ModelCallOptions): Promise<string> {
  const { settings } = options
  if (!settings.apiKey.trim() && settings.provider !== 'custom') {
    throw new ModelCallError('Enter an API key for the selected provider first.')
  }
  if (!settings.model.trim()) throw new ModelCallError('Enter a model name first.')
  return settings.provider === 'anthropic' ? callAnthropic(options) : callOpenAiCompatible(options)
}

async function callAnthropic({ settings, system, user, signal, onProgress }: ModelCallOptions) {
  // Loaded on first use so the SDK stays out of the editor's main bundle.
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  // The key is the user's own and never leaves their browser except for
  // api.anthropic.com, which is the whole point of the "bring your own key" mode.
  const client = new Anthropic({ apiKey: settings.apiKey.trim(), dangerouslyAllowBrowser: true })
  try {
    const stream = client.messages.stream(
      {
        model: settings.model.trim(),
        max_tokens: 64000,
        system,
        messages: [{ role: 'user', content: user }],
      },
      { signal },
    )
    stream.on('text', (_delta, snapshot) => onProgress?.(snapshot.length))
    const message = await stream.finalMessage()
    if (message.stop_reason === 'refusal') {
      throw new ModelCallError(
        `The model declined this request${message.stop_details?.explanation ? `: ${message.stop_details.explanation}` : '.'}`,
      )
    }
    if (message.stop_reason === 'max_tokens') {
      throw new ModelCallError('The response was cut off (max tokens). Try a smaller diagram or change.')
    }
    return message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
  } catch (err) {
    if (err instanceof ModelCallError) throw err
    if (err instanceof Anthropic.AuthenticationError) {
      throw new ModelCallError('Anthropic rejected the API key.')
    }
    if (err instanceof Anthropic.NotFoundError) {
      throw new ModelCallError(`Unknown model "${settings.model}".`)
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new ModelCallError('Rate limited by Anthropic — wait a moment and retry.')
    }
    if (err instanceof Anthropic.APIError) {
      throw new ModelCallError(`Anthropic error ${err.status ?? ''}: ${err.message}`)
    }
    if (err instanceof Anthropic.APIUserAbortError || isAbort(err)) {
      throw new ModelCallError('Cancelled.')
    }
    throw new ModelCallError(describeNetworkError(err))
  }
}

/** Shape of one chat-completions chunk or response we read from. */
interface ChatChoice {
  delta?: { content?: string | null }
  message?: { content?: string | { type?: string; text?: string }[] | null }
  finish_reason?: string | null
}

/** Pull the assistant text out of a non-streaming chat-completions body. */
export function extractChatCompletionText(body: unknown): { text: string; finish: string | null } {
  const choice = (body as { choices?: ChatChoice[] } | null)?.choices?.[0]
  if (!choice) {
    const error = (body as { error?: { message?: string } } | null)?.error?.message
    throw new ModelCallError(error ? `Provider error: ${error}` : 'Empty response from the provider.')
  }
  const content = choice.message?.content
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content.map((part) => (part.type === 'text' ? (part.text ?? '') : '')).join('')
        : ''
  return { text, finish: choice.finish_reason ?? null }
}

async function callOpenAiCompatible({
  settings,
  system,
  user,
  signal,
  onProgress,
}: ModelCallOptions) {
  const info = providerInfo(settings.provider)
  const base = (settings.provider === 'custom' ? settings.baseUrl : info.baseUrl ?? '')
    .trim()
    .replace(/\/+$/, '')
  if (!base) throw new ModelCallError('Enter the base URL of your OpenAI-compatible server.')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (settings.apiKey.trim()) headers.Authorization = `Bearer ${settings.apiKey.trim()}`
  if (settings.provider === 'openrouter') headers['X-Title'] = 'Flow diagram editor'

  let response: Response
  try {
    response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model: settings.model.trim(),
        stream: true,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
  } catch (err) {
    if (isAbort(err)) throw new ModelCallError('Cancelled.')
    throw new ModelCallError(describeNetworkError(err))
  }

  if (!response.ok) {
    let detail: string
    try {
      const body = (await response.json()) as { error?: { message?: string } | string }
      detail =
        typeof body.error === 'string' ? body.error : (body.error?.message ?? JSON.stringify(body))
    } catch {
      detail = await response.text().catch(() => '')
    }
    if (response.status === 401) throw new ModelCallError(`The provider rejected the API key. ${detail}`)
    if (response.status === 404) {
      throw new ModelCallError(`Unknown model or endpoint (${settings.model}). ${detail}`)
    }
    throw new ModelCallError(`Provider error ${response.status}: ${detail}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream') || !response.body) {
    // Servers that ignore `stream: true` answer with one JSON document.
    const { text, finish } = extractChatCompletionText(await response.json())
    if (finish === 'length') {
      throw new ModelCallError('The response was cut off (max tokens). Try a smaller diagram or change.')
    }
    return text
  }

  // Server-sent events: `data: {...}` lines, terminated by `data: [DONE]`.
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  let finish: string | null = null
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const payload = line.startsWith('data:') ? line.slice(5).trim() : ''
      if (!payload || payload === '[DONE]') continue
      let chunk: { choices?: ChatChoice[]; error?: { message?: string } }
      try {
        chunk = JSON.parse(payload)
      } catch {
        continue
      }
      if (chunk.error?.message) throw new ModelCallError(`Provider error: ${chunk.error.message}`)
      const choice = chunk.choices?.[0]
      if (choice?.delta?.content) {
        text += choice.delta.content
        onProgress?.(text.length)
      }
      if (choice?.finish_reason) finish = choice.finish_reason
    }
  }
  if (finish === 'length') {
    throw new ModelCallError('The response was cut off (max tokens). Try a smaller diagram or change.')
  }
  return text
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException ? err.name === 'AbortError' : false
}

function describeNetworkError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Could not reach the provider. Check your connection and, for a custom server, that it allows browser (CORS) requests from this site.'
  }
  return message
}
