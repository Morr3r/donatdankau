"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type OptionHTMLAttributes,
  type ReactNode,
  type ReactElement,
  type SelectHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size"> & {
  "data-tour"?: string;
};

type SelectOption = {
  value: string;
  label: string;
  disabled: boolean;
};

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => nodeText(child)).join("").trim();
  }

  if (node && typeof node === "object" && "props" in node) {
    const withProps = node as { props?: { children?: ReactNode } };
    return nodeText(withProps.props?.children).trim();
  }

  return "";
}

function parseOptions(children: ReactNode): SelectOption[] {
  const parsed: SelectOption[] = [];

  for (const child of Children.toArray(children)) {
    if (!isValidElement(child) || child.type !== "option") continue;
    const optionElement = child as ReactElement<OptionHTMLAttributes<HTMLOptionElement>>;

    const optionValue = optionElement.props.value ?? "";
    parsed.push({
      value: String(optionValue),
      label: nodeText(optionElement.props.children) || String(optionValue),
      disabled: Boolean(optionElement.props.disabled),
    });
  }

  return parsed;
}

function normalizeSelectValue(value: string | number | readonly string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ? String(value[0]) : "";
  }

  return value == null ? "" : String(value);
}

function findEnabledIndex(options: SelectOption[], startIndex: number, direction: 1 | -1) {
  if (options.length === 0) return -1;

  let cursor = startIndex;
  for (let i = 0; i < options.length; i += 1) {
    cursor = (cursor + direction + options.length) % options.length;
    if (!options[cursor]?.disabled) {
      return cursor;
    }
  }

  return -1;
}

export function Select({
  className,
  children,
  id,
  name,
  value,
  defaultValue,
  required,
  disabled,
  onChange,
  onBlur,
  onFocus,
  autoFocus,
  "data-tour": dataTour,
  ...nativeSelectProps
}: SelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nativeSelectRef = useRef<HTMLSelectElement>(null);
  const listboxId = useId();

  const options = useMemo(() => parseOptions(children), [children]);
  const firstEnabledValue = useMemo(() => options.find((option) => !option.disabled)?.value ?? "", [options]);
  const normalizedDefaultValue = normalizeSelectValue(defaultValue);
  const hasDefaultValue = options.some((option) => option.value === normalizedDefaultValue);

  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    hasDefaultValue ? normalizedDefaultValue : firstEnabledValue,
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isControlled = value !== undefined;
  const selectedValue = isControlled ? normalizeSelectValue(value) : uncontrolledValue;
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const triggerLabel = selectedOption?.label ?? options[0]?.label ?? "Pilih opsi";
  const isPlaceholderValue = selectedOption?.value === "" || selectedOption == null;
  const preferredIndex =
    selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : findEnabledIndex(options, -1, 1);

  useEffect(() => {
    if (!autoFocus) return;
    triggerRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!open) return;

    const closeDropdown = () => setOpen(false);

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => closeDropdown();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  const syncValueAndEmitChange = (nextValue: string) => {
    const native = nativeSelectRef.current;
    if (!native) return;

    native.value = nextValue;
    native.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const selectOption = (option: SelectOption) => {
    if (disabled || option.disabled) return;

    if (!isControlled) {
      setUncontrolledValue(option.value);
    }

    syncValueAndEmitChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const toggleDropdown = () => {
    setOpen((previous) => {
      const next = !previous;
      if (next) {
        setActiveIndex(preferredIndex);
      }
      return next;
    });
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((previous) => findEnabledIndex(options, open ? previous : preferredIndex, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((previous) => findEnabledIndex(options, open ? previous : preferredIndex, -1));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(preferredIndex);
        return;
      }

      if (activeIndex >= 0) {
        const option = options[activeIndex];
        if (option) {
          selectOption(option);
        }
      }
    }
  };

  return (
    <div ref={rootRef} className={cn("group relative w-full", className)} data-tour={dataTour}>
      <select
        {...nativeSelectProps}
        ref={nativeSelectRef}
        name={name}
        required={required}
        disabled={disabled}
        value={selectedValue}
        onChange={(event) => {
          if (!isControlled) {
            setUncontrolledValue(event.target.value);
          }
          onChange?.(event);
        }}
        onBlur={onBlur}
        onFocus={onFocus}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
      >
        {children}
      </select>

      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "peer h-12 w-full rounded-xl border border-[#d9b88a] bg-[linear-gradient(145deg,#fffdf8_0%,#fff2df_100%)] px-4 pr-12 text-left text-sm font-medium text-[#472b1c] shadow-[0_14px_28px_-20px_rgba(71,43,28,0.58),inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition duration-200 hover:border-[#cf8f37] hover:bg-[linear-gradient(145deg,#fffefb_0%,#fff5e8_100%)] hover:shadow-[0_20px_36px_-24px_rgba(71,43,28,0.62),inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:border-[#cf8f37] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#f2cf95] focus-visible:shadow-[0_0_0_1px_rgba(207,143,55,0.24),0_20px_36px_-24px_rgba(71,43,28,0.62)] disabled:cursor-not-allowed disabled:border-[#e8d2b5] disabled:bg-[#f8ecdd] disabled:text-[#98745a] disabled:shadow-none",
          open && "border-[#cf8f37] bg-white shadow-[0_0_0_1px_rgba(207,143,55,0.24),0_20px_36px_-24px_rgba(71,43,28,0.62)]",
          isPlaceholderValue && "text-[#9c7555]",
        )}
      >
        <span className="block truncate">{triggerLabel}</span>
      </button>

      <span className="pointer-events-none absolute inset-y-2 right-11 w-px rounded-full bg-[#ecd5b7] transition duration-200 group-hover:bg-[#e4c49d] peer-focus-visible:bg-[#e1bc8a] peer-disabled:bg-[#efdfca]" />
      <ChevronDown
        size={17}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#916343] transition duration-200 group-hover:text-[#ba7a37] peer-focus-visible:text-[#ba7a37] peer-disabled:text-[#c09e84]",
          open && "rotate-180 text-[#ba7a37]",
        )}
      />

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          className="absolute z-[95] mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#e4be8e] bg-[linear-gradient(180deg,#fffaf2_0%,#fff0dc_100%)] p-1.5 shadow-[0_24px_54px_-30px_rgba(67,39,21,0.64)]"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#8d6b4d]">Tidak ada opsi</div>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === selectedValue;
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition duration-150",
                    option.disabled
                      ? "cursor-not-allowed text-[#b89476]"
                      : "text-[#4b2f1f]",
                    !option.disabled && "hover:bg-[#ffe9ca]",
                    isActive && !option.disabled && "bg-[#ffe6c2]",
                    isSelected && "bg-[linear-gradient(120deg,#efb14e_0%,#e7997b_100%)] font-semibold text-[#3a2217] shadow-[0_12px_20px_-14px_rgba(168,99,36,0.66)]",
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

