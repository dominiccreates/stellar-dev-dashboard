import React, { useState } from 'react'
import { getAllTemplates } from '../../lib/templateManager'
import TemplateCard from './TemplateCard'
import TemplateDeployer from './TemplateDeployer'

const CATEGORIES = ['all', 'token', 'escrow', 'governance', 'nft']

export default function TemplateLibrary() {
  const templates = getAllTemplates()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? templates : templates.filter((t) => t.category === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '5px 12px',
              background: filter === cat ? 'var(--cyan-glow)' : 'transparent',
              border: `1px solid ${filter === cat ? 'var(--cyan-dim)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: filter === cat ? 'var(--cyan)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '12px',
      }}>
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selected?.id === template.id}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* Deployer panel */}
      {selected && (
        <TemplateDeployer
          template={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
