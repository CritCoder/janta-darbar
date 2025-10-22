import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
import { cn } from "../../lib/utils"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef(({ 
  defaultOpen = true, 
  open: openProp, 
  onOpenChange: setOpenProp, 
  children, 
  ...props 
}, ref) => {
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const state = {
    open,
    setOpen,
    openMobile: false,
    setOpenMobile: () => {},
  }

  return (
    <SidebarContext.Provider value={state}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
})

const Sidebar = React.forwardRef(({ 
  side = "left", 
  variant = "sidebar", 
  collapsible = "offcanvas", 
  className, 
  children, 
  ...props 
}, ref) => {
  const { open, setOpen } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "group/sidebar-wrapper flex h-full w-full has-[[data-variant=inset]]:bg-sidebar",
        className
      )}
      {...props}
    >
      <div
        data-state={open ? "expanded" : "collapsed"}
        data-collapsible={collapsible}
        data-variant={variant}
        data-side={side}
        className="group peer hidden md:flex"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          } ?? {}
        }
      >
        <div className="group-data-[collapsible=offcanvas]:fixed group-data-[collapsible=offcanvas]:inset-y-0 group-data-[collapsible=offcanvas]:start-0 group-data-[collapsible=offcanvas]:z-10 group-data-[collapsible=offcanvas]:hidden group-data-[state=expanded]:group-data-[collapsible=offcanvas]:flex">
          <div className="group-data-[collapsible=offcanvas]:w-[--sidebar-width] group-data-[collapsible=offcanvas]:border-r group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:duration-300 group-data-[collapsible=offcanvas]:will-change-[width] group-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:group-data-[collapsible=offcanvas]:w-[--sidebar-width-icon]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
})

const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="trigger"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md p-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
})

const SidebarRail = React.forwardRef(({ className, ...props }, ref) => {
  const { setOpen } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      onClick={() => setOpen(false)}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:transition-all after:duration-300 hover:after:bg-sidebar-accent group-data-[state=collapsed]:flex group-data-[state=collapsed]:translate-x-0",
        className
      )}
      {...props}
    />
  )
})

const SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-screen flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100vh-theme(spacing.4))] peer-data-[variant=inset]:m-2 peer-data-[variant=inset]:rounded-xl peer-data-[variant=inset]:border peer-data-[variant=inset]:bg-background",
        className
      )}
      {...props}
    />
  )
})

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})

const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <hr
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=offcanvas]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})

const SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=offcanvas]:group-data-[collapsible=offcanvas]:-mt-8 group-data-[collapsible=offcanvas]:group-data-[collapsible=offcanvas]:opacity-0",
        "group-data-[collapsible=icon]:group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})

const SidebarGroupAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=offcanvas]:group-data-[collapsible=offcanvas]:-mt-8 group-data-[collapsible=offcanvas]:group-data-[collapsible=offcanvas]:opacity-0",
        "group-data-[collapsible=icon]:group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
})

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
})

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
})

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:not([data-sidebar=icon])]:hidden group-data-[collapsible=icon]:[&>span:not([data-sidebar=icon])]:hidden group-data-[collapsible=icon]:justify-center",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef(({ 
  asChild = false, 
  isActive = false, 
  variant = "default", 
  size = "default", 
  tooltip, 
  className, 
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

const SidebarMenuAction = React.forwardRef(({ 
  asChild = false, 
  showOnHover = false, 
  className, 
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})

const SidebarMenuBadge = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:text-xs",
        "peer-data-[size=default]/menu-button:text-xs",
        "peer-data-[size=lg]/menu-button:text-sm",
        className
      )}
      {...props}
    />
  )
})

const SidebarMenuSkeleton = React.forwardRef(({ 
  showIcon = false, 
  className, 
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn(
        "group/menu-skeleton flex h-8 w-full items-center gap-2 px-2 py-1",
        "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2",
        className
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton className="size-4 rounded-md" />
      )}
      <Skeleton className="h-4 flex-1" />
    </div>
  )
})

const Skeleton = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-sidebar-primary/10", className)}
      {...props}
    />
  )
})

const SidebarMenuSub = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn("mx-3.5 flex w-full min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-3.5", className)}
      {...props}
    />
  )
})

const SidebarMenuSubItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <li
      ref={ref}
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item", className)}
      {...props}
    />
  )
})

const SidebarMenuSubButton = React.forwardRef(({ 
  asChild = false, 
  size = "sm", 
  isActive = false, 
  className, 
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-left text-xs outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
})

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
