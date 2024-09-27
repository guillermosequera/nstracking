import React from 'react'

export default function InventoryTable({ title, inventory, columns }) {
  if (!inventory || inventory.length === 0) {
    return (
      <div>
        <h2 className='text-2xl font-semibold mb-4'>{title}</h2>
        <p className='text-gray-400'>No hay productos para mostrar.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="bg-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full divide-y divide-gray-700">
          <thead className="bg-blue-800">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {inventory.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}>
                <td className="px-4 py-4 text-sm text-gray-300">{item.bodega}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{item.codprod}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{item.desprod}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{item.desprod2}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{item.unidad}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{item.grupo}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{item.pieza}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}