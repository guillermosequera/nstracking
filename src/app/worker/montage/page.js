'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerMontageView from '@/components/WorkerMontageView'

export default function WorkerMontagePage() {
  return (
    <WorkerPageBase title="Worker Montage Dashboard" role="workerMontage">
      <WorkerMontageView />
    </WorkerPageBase>
  )
}