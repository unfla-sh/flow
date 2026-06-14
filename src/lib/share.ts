import { parseWorkflowFile, serializeDoc, type ParseResult } from '@/lib/workflowFile'
import { useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowDoc } from '@/types/workflow'

const PREFIX = 'flow='

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function gzip(str: string): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  void writer.write(new TextEncoder().encode(str) as BufferSource)
  void writer.close()
  return new Uint8Array(await new Response(cs.readable).arrayBuffer())
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  void writer.write(bytes as BufferSource)
  void writer.close()
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer())
}

/**
 * Encode a doc to a URL-safe string. Tag 'z' = gzipped (compact, used for big
 * flows), 'r' = raw fallback if compression is unavailable. The payload rides
 * in the URL hash, which is never sent to a server, so length is bounded only
 * by the browser (megabytes) — large flows share fine, just with longer links.
 */
export async function encodeDoc(doc: WorkflowDoc): Promise<string> {
  const json = serializeDoc(doc)
  try {
    return 'z' + bytesToB64Url(await gzip(json))
  } catch {
    return 'r' + bytesToB64Url(new TextEncoder().encode(json))
  }
}

/** Decode + validate a doc from an encoded share string. */
export async function decodeDoc(encoded: string): Promise<ParseResult> {
  try {
    const tag = encoded[0]
    const body = encoded.slice(1)
    const json =
      tag === 'z'
        ? await gunzip(b64UrlToBytes(body))
        : new TextDecoder().decode(b64UrlToBytes(tag === 'r' ? body : encoded))
    return parseWorkflowFile(json)
  } catch {
    return { ok: false, error: 'Could not decode the shared workflow link.' }
  }
}

/** A shareable URL embedding the current workflow in the hash. */
export async function buildShareUrl(): Promise<string> {
  const { doc } = useWorkflowStore.getState()
  return `${location.origin}${location.pathname}#${PREFIX}${await encodeDoc(doc)}`
}

/** If the current URL hash carries a shared workflow, decode it. */
export async function readSharedDoc(): Promise<ParseResult | null> {
  const hash = location.hash.replace(/^#/, '')
  if (!hash.startsWith(PREFIX)) return null
  return decodeDoc(hash.slice(PREFIX.length))
}

/** Whether the current URL hash carries a shared workflow. */
export function hasSharedDoc(): boolean {
  return location.hash.replace(/^#/, '').startsWith(PREFIX)
}

/** Drop the share payload from the address bar without reloading. */
export function clearShareHash() {
  history.replaceState(null, '', location.pathname + location.search)
}
