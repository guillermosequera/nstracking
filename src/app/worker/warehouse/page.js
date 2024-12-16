'use client'

import { withWorkerAuth } from '@/components/hoc/withWorkerAuth'
import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerWarehouseView from '@/components/WorkerWarehouseView'

function WorkerWarehousePage() {
  return (
    <WorkerPageBase title="Worker Warehouse Dashboard" role="workerWareHouse">
      <WorkerWarehouseView />
    </WorkerPageBase>
  )
}

export default withWorkerAuth(WorkerWarehousePage, 'workerWareHouse')