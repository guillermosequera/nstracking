'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerCommerceView from '@/components/WorkerCommerceView'

function WorkerCommercePage() {
  return (
    <WorkerPageBase title="Worker Commerce Dashboard" role="workerCommerce">
      <WorkerCommerceView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerCommercePage, 'workerCommerce')