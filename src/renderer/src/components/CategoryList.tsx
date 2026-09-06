import React, { useState } from 'react'
import { Pencil, Trash2, Tag, Inbox } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

type InputType = 'DROPDOWN' | 'TEXT' | 'NUMBER' | 'LINKED_LIST'

interface Attribute {
  id: string
  name: string
  inputType: InputType
  options: string[] | null
}

interface Category {
  id: string
  name: string
  active: boolean
  attributes: Attribute[]
}

interface CategoryListProps {
  categories: Category[]
  isLoading: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleDeleteClick = (category: Category) => {
    if (pendingDeleteId === category.id) {
      onDelete(category)
      setPendingDeleteId(null)
    } else {
      setPendingDeleteId(category.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Inbox size={28} className="text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          No categories yet. Create one to start adding stock.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {categories.map(category => (
        <div
          key={category.id}
          className="card flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
              <Tag size={16} className="text-[var(--color-accent)]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {category.name}
                </h3>
                <span className={`badge ${category.active ? 'badge-success' : 'badge-neutral'}`}>
                  {category.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {category.attributes.length === 0 ? (
                <p className="text-xs text-[var(--color-warning)] mt-1.5">
                  No attributes — this category can't be used yet
                </p>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {category.attributes.map(attr => (
                    <div key={attr.id} className="flex items-center flex-wrap gap-1.5 text-xs">
                      <span className="badge badge-neutral">{attr.name}</span>
                      {attr.inputType === 'DROPDOWN' && attr.options && attr.options.length > 0 ? (
                        <span className="text-[var(--color-text-muted)]">
                          {attr.options.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)] italic">
                          {attr.inputType === 'TEXT'
                            ? 'free text'
                            : attr.inputType === 'NUMBER'
                            ? 'number'
                            : 'linked list'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="btn btn-ghost !px-2.5"
              aria-label={`Edit ${category.name}`}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(category)}
              className={`btn !px-2.5 ${pendingDeleteId === category.id ? 'btn-danger' : 'btn-ghost'}`}
              aria-label={`Delete ${category.name}`}
            >
              {pendingDeleteId === category.id ? (
                <span className="text-xs font-medium px-1">Confirm?</span>
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
