'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerCommerceView from '@/components/WorkerCommerceView'

export default function WorkerCommercePage() {
  return (
    <WorkerPageBase title="Worker Commerce Dashboard" role="workerCommerce">
      <WorkerCommerceView />
    </WorkerPageBase>
  )
}