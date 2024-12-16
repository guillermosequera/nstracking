import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
//import { useTheme } from 'next-themes'

export default function Legend({ legends }) {
  
  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`p-3 rounded-full cursor-help transition-colors ${
              "bg-slate-200 hover:bg-slate-300"
            }`}>
              <Info className={`h-6 w-6 ${
                "text-slate-700"
              }`} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className={`${
            "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="p-3 space-y-2">
              {legends.map((legend, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{legend.value}</span>
                  <span className={"text-slate-500"}>-</span>
                  <span className="text-sm">{legend.standard}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}