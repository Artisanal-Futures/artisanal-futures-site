'use client'

import { useEffect, useRef } from 'react'
import { useUploadFile } from 'better-upload/client'

type Props = {
  route: string
  api: string
  generateThumbnail?: boolean
}
export const useFileUpload = ({
  route,
  api,
  generateThumbnail = true,
}: Props) => {
  const uploadRef = useRef<string | null>(null)

  const { upload, uploadedFile, isSuccess, isError, isPending } = useUploadFile(
    {
      route,
      api,
    },
  )

  useEffect(() => {
    if (uploadedFile?.objectKey) {
      uploadRef.current = uploadedFile.objectKey
    }
  }, [uploadedFile])

  const uploadFile = async (file: File): Promise<string | null> => {
    await upload(file)

    // Wait for uploadRef to be updated
    const response = await new Promise((resolve) => {
      const checkUpload = setInterval(() => {
        if (uploadRef.current) {
          clearInterval(checkUpload)
          resolve({
            fileUrl: `${uploadRef.current}`,
          })
        }
      }, 100)
    })

    if (isError) {
      throw new Error('Upload failed')
    }

    const data = response as { fileUrl: string }

    if (data.fileUrl && generateThumbnail) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', data.fileUrl)

      const response = await fetch('/api/create-thumbnail', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to create thumbnail')
      }

      const thumbnailData = (await response.json()) as {
        thumbnailUrl: string
        format: string
      }
      console.log('Thumbnail upload response:', thumbnailData)
    }

    return data.fileUrl
  }

  return {
    uploadFile,
    uploadedFile,
    isUploading: isPending,
    uploadError: isError,
    uploadSuccess: isSuccess,
  }
}
