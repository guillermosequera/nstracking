'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerLabsMineralView from '@/components/WorkerLabsMineralView'

export default function WorkerLabsMineralPage() {
  return (
    <WorkerPageBase title="Worker Labs Mineral Dashboard" role="workerLabsMineral">
      <WorkerLabsMineralView />
    </WorkerPageBase>
  )
}