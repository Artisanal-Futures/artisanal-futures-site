'use client'

import { Button } from '~/components/ui/button'
import { type UpcyclingItem } from '~/types'

interface ExportAsCSVProps {
  upcycling: UpcyclingItem[]
}

export function ExportAsCSV({ upcycling }: ExportAsCSVProps) {
  const downloadCSV = () => {
    // Define CSV headers
    const headers = [
      'Project Title',
      'User Email',
      'Prompt',
      'Question',
      'AI Response',
      'Like Status',
      'Like Category',
      'Like Reason',
      'Created At',
    ].join(',')

    // Convert data to CSV rows
    const rows = upcycling.map((item) => {
      return [
        `"${item.project_title.replace(/"/g, '""')}"`,
        `"${item.user?.email ?? 'Guest'}"`,
        `"${item.prompt.replace(/"/g, '""')}"`,
        `"${item.question.replace(/"/g, '""')}"`,
        `"${item.llm_response.replace(/"/g, '""')}"`,
        `"${item.like?.is_liked ? 'Liked' : item.like?.is_liked === false ? 'Disliked' : 'No Rating'}"`,
        `"${item.like?.mod_category ?? ''}"`,
        `"${item.like?.reason?.replace(/"/g, '""') ?? ''}"`,
        new Date(item.generation_date ?? '').toLocaleString(),
      ].join(',')
    })

    // Combine headers and rows
    const csv = [headers, ...rows].join('\n')

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `upcycling-export-${new Date().toISOString()}.csv`,
      )
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Button onClick={downloadCSV} variant="outline" size="sm">
      Export as CSV
    </Button>
  )
}
