'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerLabsMineralView from '@/components/WorkerLabsMineralView'

function WorkerLabsMineralPage() {
  return (
    <WorkerPageBase title="Worker Labs Mineral Dashboard" role="workerLabsMineral">
      <WorkerLabsMineralView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerLabsMineralPage, 'workerLabsMineral')