export interface LocalFile {
  downloadFileName: string
  file: Buffer // the actual file
  description?: string
  format: 'XLSX' | 'PDF' | 'DOCX'
}
