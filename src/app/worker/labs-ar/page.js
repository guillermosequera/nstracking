'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerLabsARView from '@/components/WorkerLabsARView'

function WorkerLabsARPage() {
  return (
    <WorkerPageBase title="Worker Labs AR Dashboard" role="workerLabsAR">
      <WorkerLabsARView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerLabsARPage, 'workerLabsAR')