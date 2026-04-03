// Global type declaration for jsPDF loaded from CDN
declare global {
  interface Window {
    jspdf: {
      jsPDF: any
    }
  }
}

export {}
