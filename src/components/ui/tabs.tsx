import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground relative",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-[background-color,color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50 hover:text-foreground/80 data-[state=active]:hover:bg-background data-[state=active]:hover:text-foreground relative",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Enhanced Tabs with sliding indicator
const AnimatedTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, onValueChange, ...props }, ref) => {
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
    transform: 'translateX(0px)',
    width: '0px',
    opacity: 0
  });

  const tabsListRef = React.useRef<HTMLDivElement>(null);

  const updateIndicator = React.useCallback(() => {
    if (!tabsListRef.current) return;

    const activeTab = tabsListRef.current.querySelector(`[data-state="active"]`) as HTMLElement;
    if (!activeTab) return;

    const tabsListRect = tabsListRef.current.getBoundingClientRect();
    const activeTabRect = activeTab.getBoundingClientRect();

    // Calculate position relative to the tabs list container
    const translateX = activeTabRect.left - tabsListRect.left;
    const width = activeTabRect.width;

    console.log('Tab indicator update:', { translateX, width, tabsListRect, activeTabRect });

    setIndicatorStyle({
      transform: `translateX(${translateX}px)`,
      width: `${width}px`,
      opacity: 1
    });
  }, []);

  const handleValueChange = React.useCallback((value: string) => {
    onValueChange?.(value);
    // Update indicator after value change
    setTimeout(() => updateIndicator(), 10);
  }, [onValueChange, updateIndicator]);

  React.useEffect(() => {
    // Initial indicator update with fallback
    const timer = setTimeout(() => {
      updateIndicator();
      // Fallback: if indicator is still not visible, show a basic one
      if (indicatorStyle.opacity === 0) {
        setIndicatorStyle({
          transform: 'translateX(0px)',
          width: '60px',
          opacity: 1
        });
      }
    }, 100);
    
    // Update indicator on window resize
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateIndicator, indicatorStyle.opacity]);

  React.useEffect(() => {
    // Update indicator whenever tabs change
    const observer = new MutationObserver(() => {
      updateIndicator();
    });

    if (tabsListRef.current) {
      observer.observe(tabsListRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-state']
      });
    }

    return () => observer.disconnect();
  }, [updateIndicator]);

  return (
    <TabsPrimitive.Root
      ref={ref}
      className={cn("relative", className)}
      onValueChange={handleValueChange}
      {...props}
    >
      {React.Children.map(props.children, (child) => {
        if (React.isValidElement(child) && child.type === TabsPrimitive.List) {
          return React.cloneElement(child, {
            ref: tabsListRef,
            className: cn(
              "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground relative overflow-visible",
              child.props.className
            ),
            children: (
              <>
                {child.props.children}
                {/* Animated indicator */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-300 ease-out z-10"
                  style={{
                    ...indicatorStyle,
                    opacity: indicatorStyle.opacity || 0,
                    minWidth: '20px' // Ensure it has some width for debugging
                  }}
                />
              </>
            )
          } as any);
        }
        return child;
      })}
    </TabsPrimitive.Root>
  );
});

AnimatedTabs.displayName = "AnimatedTabs";

export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabs }
