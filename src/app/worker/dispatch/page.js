// src/app/worker/dispatch/page.js
'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerDispatchView from '@/components/WorkerDispatchView'

export default function WorkerDispatchPage() {
  return (
    <WorkerPageBase title="Worker Dispatch Dashboard" role="workerDispatch">
      <WorkerDispatchView />
    </WorkerPageBase>
  )
}