import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ComboboxFieldMaterialProps {
  field: any;
  groupedMaterials: Record<string, any[]>;
}

export const ComboboxFieldMaterial = ({
  field,
  groupedMaterials,
}: ComboboxFieldMaterialProps) => {
  const [open, setOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  useEffect(() => {
    if (!field.value) {
      setSelectedMaterial(null);
      return;
    }
    for (const mats of Object.values(groupedMaterials)) {
      const found = (mats as any[]).find((m) => m.id === field.value);
      if (found) {
        setSelectedMaterial(found);
        return;
      }
    }
  }, [field.value, groupedMaterials]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-8 bg-white font-normal hover:bg-slate-50 border-slate-200 text-slate-700"
        >
          <span className="truncate text-left">
            {selectedMaterial ? (
              <>
                {selectedMaterial.name}
                <span className="text-slate-400 font-mono ml-2 font-bold">
                  ({selectedMaterial.width?.toFixed(2)}m)
                </span>
              </>
            ) : (
              <span className="text-slate-400">Buscar material...</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 bg-white border-slate-200 shadow-md z-50"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput
            placeholder="Buscar material..."
            className="h-9 border-none focus:ring-0"
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm text-slate-500">
              No hay resultados.
            </CommandEmpty>
            {Object.entries(groupedMaterials).map(([category, mats]) => (
              <CommandGroup
                key={category}
                heading={
                  <span className="bg-slate-100 text-blue-800 font-black tracking-wider uppercase text-[10px] py-1 px-2 rounded">
                    {category}
                  </span>
                }
              >
                {(mats as any[]).map((m: any) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.name} ${m.width || ""}`}
                    onSelect={() => {
                      field.onChange(m.id);
                      setSelectedMaterial(m);
                      setOpen(false);
                    }}
                    className="cursor-pointer hover:bg-slate-100 text-slate-700 text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-blue-600 flex-shrink-0",
                        field.value === m.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>
                      {m.name}
                      <span className="text-slate-400 font-mono ml-2 font-bold">
                        ({m.width?.toFixed(2)}m)
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
