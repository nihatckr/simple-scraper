import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/types'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions = {},
) {
  const { immediate = true, onSuccess, onError } = options
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await apiCall()
      setState({ data, loading: false, error: null })
      onSuccess?.(data)
      return data
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'An unexpected error occurred'
      setState({ data: null, loading: false, error: errorMessage })
      onError?.(error as ApiError)
      throw error
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, deps)

  return {
    ...state,
    execute,
    refetch: execute,
  }
}

// Specialized hooks for common patterns
export function useApiWithRefresh<T>(
  apiCall: () => Promise<T>,
  refreshInterval?: number,
  deps: any[] = [],
) {
  const api = useApi(apiCall, deps)

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (!api.loading) {
          api.refetch()
        }
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval, api.loading])

  return api
}

export function useApiPagination<T>(
  apiCall: (
    page: number,
    limit: number,
  ) => Promise<{ data: T[]; pagination: any }>,
  initialPage = 1,
  initialLimit = 20,
) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const api = useApi(() => apiCall(page, limit), [page, limit])

  const nextPage = () => {
    if (api.data?.pagination && page < api.data.pagination.pages) {
      setPage((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1)
    }
  }

  const goToPage = (newPage: number) => {
    if (
      newPage >= 1 &&
      (!api.data?.pagination || newPage <= api.data.pagination.pages)
    ) {
      setPage(newPage)
    }
  }

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }

  return {
    ...api,
    page,
    limit,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    pagination: api.data?.pagination,
  }
}
