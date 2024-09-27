'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getUserWarehouse } from '@/config/roles'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LogoutButton from './LogoutButton'

export default function AddInventoryView() {
  const [action, setAction] = useState('add') // 'add' for new product, 'increment' for existing product
  const [formData, setFormData] = useState({
    codprod: '',
    desprod: '',
    desprod2: '',
    unidad: '',
    grupo: '',
    pieza: '',
    bodega: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [inventoryData, setInventoryData] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const { data: session } = useSession()
  const router = useRouter()
  const userWarehouse = getUserWarehouse(session?.user?.email)

  useEffect(() => {
    if (session?.user?.email) {
      fetchInventoryData()
    }
  }, [session])

  const fetchInventoryData = async () => {
    try {
      const response = await fetch(`/api/inventory?warehouse=${userWarehouse === 'all' ? 'all' : userWarehouse}`)
      if (!response.ok) throw new Error('Failed to fetch inventory data')
      const data = await response.json()
      setInventoryData(data)
      
      // Extract unique warehouses
      const uniqueWarehouses = [...new Set(data.map(item => item.bodega))]
      setWarehouses(uniqueWarehouses)
    } catch (error) {
      setError('Error fetching inventory data: ' + error.message)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleProductSelect = (codprod) => {
    const product = inventoryData.find(item => item.codprod === codprod)
    if (product) {
      setFormData({
        ...formData,
        codprod: product.codprod,
        desprod: product.desprod,
        desprod2: product.desprod2 || '',
        unidad: product.unidad,
        grupo: product.grupo,
        bodega: product.bodega,
        pieza: ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          warehouse: userWarehouse === 'all' ? formData.bodega : userWarehouse,
          userEmail: session.user.email,
          action: action
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action === 'add' ? 'add' : 'update'} product`)
      }

      setSuccess(true)
      setFormData({
        codprod: '',
        desprod: '',
        desprod2: '',
        unidad: '',
        grupo: '',
        pieza: '',
        bodega: ''
      })
      fetchInventoryData() // Refresh inventory data
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 py-4 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">Gestión de Inventario</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {session.user.email} ({userWarehouse})
            </span>
            <Button
              onClick={() => router.push('/inventory')}
              className="bg-blue-800 text-white"
            >
              Ver Inventario
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 space-y-6 pb-16">
        <Select onValueChange={(value) => setAction(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione una acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">Añadir nuevo producto</SelectItem>
            <SelectItem value="increment">Incrementar piezas</SelectItem>
          </SelectContent>
        </Select>

        <form onSubmit={handleSubmit} className="space-y-4">
          {action === 'increment' && (
            <Select onValueChange={handleProductSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione un producto" />
              </SelectTrigger>
              <SelectContent>
                {inventoryData.map((product) => (
                  <SelectItem key={product.codprod} value={product.codprod}>
                    {product.codprod} - {product.desprod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Input
            name="codprod"
            value={formData.codprod}
            onChange={handleChange}
            placeholder="Código de producto"
            required
            className="bg-gray-800 text-white"
            disabled={action === 'increment'}
          />
          <Input
            name="desprod"
            value={formData.desprod}
            onChange={handleChange}
            placeholder="Descripción"
            required
            className="bg-gray-800 text-white"
            disabled={action === 'increment'}
          />
          <Input
            name="desprod2"
            value={formData.desprod2}
            onChange={handleChange}
            placeholder="Descripción 2"
            className="bg-gray-800 text-white"
            disabled={action === 'increment'}
          />
          <Input
            name="unidad"
            value={formData.unidad}
            onChange={handleChange}
            placeholder="Unidad"
            required
            className="bg-gray-800 text-white"
            disabled={action === 'increment'}
          />
          <Input
            name="grupo"
            value={formData.grupo}
            onChange={handleChange}
            placeholder="Grupo"
            required
            className="bg-gray-800 text-white"
            disabled={action === 'increment'}
          />
          <Input
            name="pieza"
            value={formData.pieza}
            onChange={handleChange}
            placeholder={action === 'add' ? "Cantidad inicial" : "Cantidad a incrementar"}
            type="number"
            required
            className="bg-gray-800 text-white"
          />
          {userWarehouse === 'all' && (
            <Select name="bodega" onValueChange={(value) => setFormData({ ...formData, bodega: value })} required>
              <SelectTrigger className="w-full bg-gray-800 text-white">
                <SelectValue placeholder="Seleccione una bodega" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button type="submit" className="bg-blue-800 text-white">
            {action === 'add' ? 'Añadir Producto' : 'Incrementar Piezas'}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900 border-green-700 text-green-100">
            <AlertDescription>
              {action === 'add' ? 'Producto añadido con éxito' : 'Piezas incrementadas con éxito'}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Inventario Actual</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Código</th>
                <th className="text-left">Descripción</th>
                <th className="text-left">Bodega</th>
                <th className="text-left">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}>
                  <td className="p-2">{item.codprod}</td>
                  <td className="p-2">{item.desprod}</td>
                  <td className="p-2">{item.bodega}</td>
                  <td className="p-2">{item.pieza}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}