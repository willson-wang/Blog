import type { FC } from 'react'
import React from 'react'
import AnchorLink from './AnchorLink'

const SlugsList: FC<{ slugs: any; className?: string }> = ({ slugs, ...props }) => {
  return (
    <ul role="slug-list" {...props} className="default-layout-toc">
      {slugs
        .filter(({ depth }: { depth: number }) => depth >= 1 && depth < 4)
        .map((slug: any) => (
          <li key={slug.value} title={slug.value} data-depth={slug.depth}>
            <AnchorLink href={`${slug.url}`}>
              <span>{slug.value}</span>
            </AnchorLink>
          </li>
        ))}
    </ul>
  )
}

export default SlugsList
