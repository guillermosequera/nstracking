'use client'

import WorkerPageBase from '@/components/WorkerPageBase'
import WorkerWarehouseView from '@/components/WorkerWarehouseView'

export default function WorkerWarehousePage() {
  return (
    <WorkerPageBase title="Worker Warehouse Dashboard" role="workerWareHouse">
      <WorkerWarehouseView />
    </WorkerPageBase>
  )
}