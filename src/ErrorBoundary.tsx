import { Component, ReactNode } from "react"

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("ErrorBoundary atrapó un error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded border border-red-400 bg-red-50 p-4">
          <h2 className="font-semibold text-red-600">
            Algo salió mal en la Bitácora
          </h2>
          <p className="text-sm text-red-700">
            Revisa la consola del navegador para más detalles o corrige los últimos
            cambios que hiciste en el código.
          </p>
          {this.state.error && (
            <pre className="mt-2 whitespace-pre-wrap text-xs text-red-800">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
