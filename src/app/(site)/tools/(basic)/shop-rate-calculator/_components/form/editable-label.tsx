'use client'

import { useRef, useState } from 'react'
import { Check, X } from 'lucide-react'

const EditableLabel = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState('New Expense ✏️')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    setIsEditing(false)
    // Handle other logic for saving the value if needed
  }

  const handleCancel = () => {
    setIsEditing(false)
    setValue('New Expense ✏️') // Resetting to the initial value
  }

  return (
    <div className="relative w-full">
      {!isEditing ? (
        <div
          onClick={() => setIsEditing(true)}
          className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-100"
        >
          {value}
        </div>
      ) : (
        <div className="w-full">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 w-full rounded border px-2 py-1"
            aria-label="Edit label"
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={handleSubmit}
              className="rounded bg-green-500 p-2 text-white"
              aria-label="Save label"
            >
              <Check />
            </button>
            <button
              onClick={handleCancel}
              aria-label="Cancel edit"
              className="rounded bg-red-500 p-2 text-white"
            >
              <X />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditableLabel
