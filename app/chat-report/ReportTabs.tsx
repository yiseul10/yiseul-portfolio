'use client'

import { useId, useState, type ReactNode } from 'react'

type ReportTab = {
  id: string
  label: string
  content: ReactNode
}

export function ReportTabs({ tabs }: { tabs: ReportTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const baseId = useId()

  return (
    <div>
      <div
        role="tablist"
        aria-label="Chat Report 보기"
        className="flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-neutral-800 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            hidden={active !== tab.id}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
