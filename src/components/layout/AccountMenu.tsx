import { Dropdown, Separator } from "@heroui/react";
import { useState } from "react";
import { LuChevronDown, LuLogOut } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, type ShellAccount, type ShellAccountLink } from "./types";

interface AccountMenuProps {
  account: ShellAccount;
  links: ShellAccountLink[];
  onSignOut: () => void;
}

function AccountAvatar({ account, className }: { account: ShellAccount; className?: string }) {
  return (
    <Avatar className={className}>
      {account.image ? <AvatarImage src={account.image} alt="" /> : null}
      <AvatarFallback className="bg-gradient-to-br from-gold to-gold-soft text-primary">
        {initials(account.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Avatar button in the top bar: who is signed in, account pages, sign out. */
export function AccountMenu({ account, links, onSignOut }: AccountMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger
          aria-label={`Account menu for ${account.name}`}
          className="flex h-10 items-center gap-2 rounded-full py-1 pl-1 pr-1 outline-none transition-colors hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-focus sm:pr-2.5"
        >
          <AccountAvatar account={account} className="size-8" />
          <span className="hidden min-w-0 text-left xl:block">
            <span className="block max-w-36 truncate text-[13px] font-semibold leading-tight text-foreground">
              {account.name}
            </span>
            <span className="block max-w-36 truncate text-[11px] leading-tight text-muted">{account.role}</span>
          </span>
          <LuChevronDown size={14} aria-hidden className="hidden text-muted sm:block" />
        </Dropdown.Trigger>

        <Dropdown.Popover placement="bottom end" offset={8} className="w-72 p-0">
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <AccountAvatar account={account} className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
              {account.email ? <p className="truncate text-xs text-muted">{account.email}</p> : null}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                {account.role}
                {account.tag ? (
                  <span className="rounded-md bg-success/10 px-1.5 py-px text-[10.5px] font-semibold text-success">
                    {account.tag}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <Separator />
          <Dropdown.Menu
            aria-label="Account"
            className="p-1.5"
            onAction={(key) => key === "sign-out" && setConfirmOpen(true)}
          >
            {links.map(({ label, href, icon: Icon }) => (
              <Dropdown.Item key={href} id={href} href={href} textValue={label} className="gap-2.5">
                <Icon size={16} aria-hidden className="shrink-0 text-muted" />
                {label}
              </Dropdown.Item>
            ))}
            <Dropdown.Item id="sign-out" textValue="Sign out" variant="danger" className="gap-2.5">
              <LuLogOut size={16} aria-hidden className="shrink-0" />
              Sign out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Sign out?"
        message="You'll need to sign in again to use the portal."
        confirmLabel="Sign out"
        tone="danger"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSignOut();
        }}
      />
    </>
  );
}
