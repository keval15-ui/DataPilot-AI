export type ApiMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export type ApiRequestOptions = {
  method?: ApiMethod;
  headers?: Record<string, string>;
  body?: unknown;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

/* -------------------------
   JSON Requests
-------------------------- */

export async function request<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      body: options.body
        ? JSON.stringify(options.body)
        : undefined,
    }
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const error = await response.json();

      if (error.detail) {
        message = `${response.status}: ${error.detail}`;
      }
    } catch {
      // Ignore if response is not JSON
    }

    throw new Error(message);
  }

  return response.json();
}

/* -------------------------
   Upload Dataset
-------------------------- */

export async function uploadDataset(
  file: File
) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    let message = "Upload failed";

    try {
      const error = await response.json();

      if (error.detail) {
        message = error.detail;
      }
    } catch {
      // Ignore if response is not JSON
    }

    throw new Error(message);
  }

  return response.json();
}