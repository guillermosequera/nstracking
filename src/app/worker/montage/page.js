'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerMontageView from '@/components/WorkerMontageView'

function WorkerMontagePage() {
  return (
    <WorkerPageBase title="Worker Montage Dashboard" role="workerMontage">
      <WorkerMontageView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerMontagePage, 'workerMontage')