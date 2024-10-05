'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerQualityView from '@/components/WorkerQualityView'

export default function WorkerQualityPage() {
  return (
    <WorkerPageBase title="Worker Quality Dashboard" role="workerQuality">
      <WorkerQualityView />
    </WorkerPageBase>
  )
}