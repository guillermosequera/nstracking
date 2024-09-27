'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Switch from '@/components/ui/Switch'

const AddInventoryView = () => {
  const [isNewProduct, setIsNewProduct] = useState(false)
  const [formData, setFormData] = useState({
    warehouse: '',
    productCode: '',
    productName: '',
    productDescription: '',
    productType: 'UN',
    productGroup: '',
    pieces: '',
    netPrice: '',
    receiptPrice: '',
    stockQuantity: '',
  })

  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: inventoryData, isLoading: isInventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  })

  const addInventoryMutation = useMutation({
    mutationFn: addToInventory,
    onSuccess: () => {
      queryClient.invalidateQueries('inventory')
      setFormData({
        warehouse: '',
        productCode: '',
        productName: '',
        productDescription: '',
        productType: 'UN',
        productGroup: '',
        pieces: '',
        netPrice: '',
        receiptPrice: '',
        stockQuantity: '',
      })
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({ ...prevData, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isNewProduct) {
      addInventoryMutation.mutate({
        ...formData,
        type: 'NEW_PRODUCT',
      })
    } else {
      addInventoryMutation.mutate({
        warehouse: formData.warehouse,
        productCode: formData.productCode,
        pieces: formData.pieces,
        type: 'INCREMENT',
      })
    }
  }

  if (isInventoryLoading) return <div>Cargando inventario...</div>

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-center items-center mb-4">
        <span className="mr-2">Añadir piezas</span>
        <Switch
          checked={isNewProduct}
          onChange={() => setIsNewProduct(!isNewProduct)}
        />
        <span className="ml-2">Nuevo producto</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="warehouse"
          value={formData.warehouse}
          onChange={handleInputChange}
          placeholder="Bodega"
          required
        />

        <Input
          name="productCode"
          value={formData.productCode}
          onChange={handleInputChange}
          placeholder="Código del producto"
          required
        />

        {isNewProduct && (
          <>
            <Input
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              placeholder="Nombre del producto"
              required
            />

            <Input
              name="productDescription"
              value={formData.productDescription}
              onChange={handleInputChange}
              placeholder="Descripción del producto"
              required
            />

            <Select
              name="productGroup"
              value={formData.productGroup}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, productGroup: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARM">ARM</SelectItem>
                <SelectItem value="BLB">BLB</SelectItem>
                <SelectItem value="CST">CST</SelectItem>
                <SelectItem value="PTL">PTL</SelectItem>
              </SelectContent>
            </Select>

            <Input
              name="netPrice"
              value={formData.netPrice}
              onChange={handleInputChange}
              placeholder="Precio neto"
              type="number"
              required
            />

            <Input
              name="receiptPrice"
              value={formData.receiptPrice}
              onChange={handleInputChange}
              placeholder="Precio de boleta"
              type="number"
              required
            />

            <Input
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              placeholder="Cantidad en stock"
              type="number"
              required
            />
          </>
        )}

        <Input
          name="pieces"
          value={formData.pieces}
          onChange={handleInputChange}
          placeholder="Cantidad de piezas"
          type="number"
          required
        />

        <Button type="submit" disabled={addInventoryMutation.isLoading}>
          {addInventoryMutation.isLoading ? 'Agregando...' : 'Agregar al inventario'}
        </Button>
      </form>

      {addInventoryMutation.isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            Error al agregar al inventario: {addInventoryMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      {addInventoryMutation.isSuccess && (
        <Alert className="mt-4">
          <AlertDescription>
            {isNewProduct ? 'Nuevo producto agregado con éxito' : 'Piezas agregadas con éxito'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

async function fetchInventory() {
  // Implementa la lógica para obtener los datos del inventario
  // Esto podría ser una llamada a la API o a Google Sheets
}

async function addToInventory(data) {
  // Implementa la lógica para agregar al inventario
  // Esto podría ser una llamada a la API o a Google Sheets
}

export default AddInventoryView