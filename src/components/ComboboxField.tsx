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

interface ComboboxFieldProps {
  field: any;
  data: any[] | undefined;
  placeholder: string;
  searchPlaceholder: string;
  onSearch?: (val: string) => void;
}

export const ComboboxField = ({
  field,
  data,
  placeholder,
  searchPlaceholder,
  onSearch,
}: ComboboxFieldProps) => {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (field.value && data) {
      const found = data.find((item) => item.id === field.value);
      if (found) setSelectedItem(found);
    }
  }, [field.value, data]);

  const getSearchValue = (item: any) =>
    item.code ? `${item.code} ${item.name}` : item.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 bg-white font-normal hover:bg-slate-50 border-slate-200 text-slate-700 overflow-hidden"
        >
          <span className="truncate">
            {selectedItem ? (
              <>
                {selectedItem.code && (
                  <span className="font-mono text-slate-400 mr-2">
                    [{selectedItem.code}]
                  </span>
                )}
                {selectedItem.name}
              </>
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border-slate-200 shadow-md z-50">
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9 border-none focus:ring-0"
            onValueChange={onSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm text-slate-500">
              No hay resultados.
            </CommandEmpty>
            <CommandGroup>
              {data?.map((item) => (
                <CommandItem
                  key={item.id}
                  value={getSearchValue(item)}
                  onSelect={() => {
                    field.onChange(item.id);
                    setSelectedItem(item);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-slate-100 text-slate-700 truncate"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-blue-600 flex-shrink-0",
                      field.value === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">
                    {item.code && (
                      <span className="font-mono text-xs text-slate-400 mr-2">
                        [{item.code}]
                      </span>
                    )}
                    {item.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
