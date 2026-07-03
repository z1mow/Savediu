"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { tr as trDayPicker } from "react-day-picker/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Savediu tarih seçici — Türkçe takvim, popover içinde.
 * value/onChange "yyyy-MM-dd" formatında string ile çalışır.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Tarih seçin",
  disabled,
  fromDate,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fromDate?: Date; // bu tarihten öncesi seçilemez
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-start rounded-xl px-3 font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="size-4 opacity-60" />
            {selected
              ? format(selected, "d MMMM yyyy, EEEE", { locale: tr })
              : placeholder}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto rounded-2xl p-2">
        <Calendar
          mode="single"
          locale={trDayPicker}
          selected={selected}
          defaultMonth={selected}
          disabled={fromDate ? { before: fromDate } : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
