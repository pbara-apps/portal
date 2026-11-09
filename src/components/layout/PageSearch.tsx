import { Menu, Modal, SearchField } from "@heroui/react";
import { Autocomplete, Header, useFilter } from "react-aria-components";
import { useNavigate } from "react-router-dom";
import { LuCornerDownLeft, LuSearch } from "react-icons/lu";
import type { ShellConfig } from "./types";

interface PageSearchProps {
  config: ShellConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⌘K dialog that jumps to any page the user can open. */
export function PageSearch({ config, open, onOpenChange }: PageSearchProps) {
  const navigate = useNavigate();
  const { contains } = useFilter({ sensitivity: "base" });
  const sections = [
    ...config.groups,
    { id: "account", label: "Account", items: config.accountLinks },
  ];

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange} isDismissable>
      <Modal.Container placement="top" size="lg" className="mt-[10vh]">
        <Modal.Dialog aria-label="Search pages" className="page-search overflow-hidden p-0">
          <Autocomplete filter={contains}>
            <div className="border-b border-separator p-2">
              <SearchField aria-label="Search pages" autoFocus className="w-full">
                <SearchField.Group className="h-11">
                  <SearchField.SearchIcon>
                    <LuSearch size={17} aria-hidden />
                  </SearchField.SearchIcon>
                  <SearchField.Input placeholder="Search pages…" className="text-[15px]" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </div>
            <Menu
              aria-label="Pages"
              onAction={(key) => go(String(key))}
              className="max-h-[min(26rem,60vh)] overflow-y-auto p-2"
              renderEmptyState={() => (
                <p className="px-4 py-10 text-center text-sm text-muted">No pages match your search.</p>
              )}
            >
              {sections.map((section) => (
                <Menu.Section key={section.id} id={section.id}>
                  <Header className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {section.label}
                  </Header>
                  {section.items.map(({ label, href, icon: Icon }) => (
                    <Menu.Item key={href} id={href} textValue={label} className="group/item gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted group-data-[focused=true]/item:text-foreground">
                        <Icon size={15} aria-hidden />
                      </span>
                      <span className="flex-1 truncate text-sm">{label}</span>
                      <LuCornerDownLeft
                        size={14}
                        aria-hidden
                        className="text-muted opacity-0 group-data-[focused=true]/item:opacity-100"
                      />
                    </Menu.Item>
                  ))}
                </Menu.Section>
              ))}
            </Menu>
          </Autocomplete>
          <div className="hidden items-center gap-4 border-t border-separator bg-surface-secondary sm:flex px-4 py-2.5 text-[11px] text-muted">
            <span><kbd className="kbd-hint">↑</kbd> <kbd className="kbd-hint">↓</kbd> to move</span>
            <span><kbd className="kbd-hint">Enter</kbd> to open</span>
            <span><kbd className="kbd-hint">Esc</kbd> to close</span>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
