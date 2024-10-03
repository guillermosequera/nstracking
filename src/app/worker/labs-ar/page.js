'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerLabsARView from '@/components/WorkerLabsARView'

export default function WorkerLabsARPage() {
  return (
    <WorkerPageBase title="Worker Labs AR Dashboard" role="workerLabsAR">
      <WorkerLabsARView />
    </WorkerPageBase>
  )
}