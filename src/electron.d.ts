export {}

declare global {
  interface Window {
    electronAPI: {
      savePdfAndOpen: (defaultFileName: string) => Promise<{
        success: boolean
        filePath?: string
        error?: string
      }>
    }
  }
}