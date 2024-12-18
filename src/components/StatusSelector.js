'use client'

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

const areas = [
  {
    name: "Bodega",
    options: ["Compras por quiebre", "Picking", "Stock ar", "NV quiebre sin compra", "Quiebre por armazon"]
  },
  {
    name: "Control Calidad",
    options: ["Control calidad", "Garantia"]
  },
  {
    name: "Laboratorio",
    options: ["Superficie polimeros", "Superficie mineral", "Tratamiento", "Tratamiento AR", "Teñido", "Reparacion mineral", "Enviado a AR", "Recibido de AR"]
  },
  {
    name: "Merma",
    options: ["Merma antireflejo", "Merma laboratorio", "Merma teñido", "Merma Montaje", "Merma bodega", "Merma comercial", "Merma material", "Merma proveedor", "Merma sistema"]
  },
  {
    name: "Montaje",
    options: ["Montaje", "Reparacion"]
  },
  {
    name: "Despacho",
    options: ["En despacho"]
  },
  {
    name: "Tienda",
    options: ["Recepcion tienda", "Entregado al cliente"]
  }
]

export default function StatusSelector({ onStatusSelect }) {
  const [selectedOption, setSelectedOption] = useState("")
  const [selectedArea, setSelectedArea] = useState(areas[0].name)

  const handleOptionSelect = (option) => {
    setSelectedOption(option)
    onStatusSelect({
      area: selectedArea,
      option: option,
      comment: ''
    })
  }

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-6">
        <Tabs defaultValue={areas[0].name} className="w-full" value={selectedArea} onValueChange={setSelectedArea}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-1 rounded-lg mb-4 bg-slate-100 p-1">
            {areas.map((area) => (
              <TabsTrigger 
                key={area.name} 
                value={area.name} 
                className={`text-xs sm:text-sm px-3 py-2 shadow-xl rounded-md transition-all duration-200
                  ${selectedArea === area.name 
                    ? 'bg-blue-600 text-white shadow-lg font-bold' 
                    : 'text-slate-600 bg-slate-400 hover:text-slate-900 hover:bg-slate-200'
                  }`}
              >
                {area.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {areas.map((area) => (
            <TabsContent 
              key={area.name} 
              value={area.name} 
              className="mt-6 transition-all duration-200 ease-in-out"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {area.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full text-xs sm:text-sm p-3 shadow-xl rounded-md transition-all duration-200
                      ${selectedOption === option 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-slate-300 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
} 