'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerQualityView from '@/components/WorkerQualityView'

function WorkerQualityPage() {
  return (
    <WorkerPageBase title="Worker Quality Dashboard" role="workerQuality">
      <WorkerQualityView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerQualityPage, 'workerQuality')