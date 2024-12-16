// src/app/worker/labs/page.js
'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerLabsView from '@/components/WorkerLabsView'

function WorkerLabsPage() {
  return (
    <WorkerPageBase title="Worker Labs Dashboard" role="workerLabs">
      <WorkerLabsView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerLabsPage, 'workerLabs')