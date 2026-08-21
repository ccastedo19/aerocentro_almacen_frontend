import { getToken } from "@/lib/auth"

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function api<T>(path: string, options: RequestOptions = {}) {
  const { body, headers, ...rest } = options
  const token = getToken()
  const isFormData = body instanceof FormData

  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isFormData
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0)
  }

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(response.status, payload),
      response.status,
      isRecord(payload) && isRecord(payload.errors)
        ? (payload.errors as Record<string, string[]>)
        : {},
    )
  }

  return payload as T
}

async function parseJson(response: Response) {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function getErrorMessage(status: number, payload: unknown) {
  if (isRecord(payload) && typeof payload.message === "string" && payload.message) {
    if (status === 429) {
      return "Demasiados intentos. Espera un minuto e inténtalo de nuevo."
    }

    return payload.message
  }

  if (status === 429) {
    return "Demasiados intentos. Espera un minuto e inténtalo de nuevo."
  }

  if (status === 401) {
    return "La sesión no es válida o ha expirado."
  }

  return "No se pudo completar la solicitud."
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
