// src/app/worker/dispatch/page.js
'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerDispatchView from '@/components/WorkerDispatchView'

function WorkerDispatchPage() {
  return (
    <WorkerPageBase title="Worker Dispatch Dashboard" role="workerDispatch">
      <WorkerDispatchView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerDispatchPage, 'workerDispatch')