// src/app/worker/labs/page.js
'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerLabsView from '@/components/WorkerLabsView'

export default function WorkerLabsPage() {
  return (
    <WorkerPageBase title="Worker Labs Dashboard" role="workerLabs">
      <WorkerLabsView />
    </WorkerPageBase>
  )
}