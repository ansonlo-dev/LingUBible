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

// Enhanced Tabs with animated underline following Medium guide approach
const AnimatedTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, onValueChange, value, defaultValue, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState<string>(defaultValue || value || '');
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  const tabsListRef = React.useRef<HTMLDivElement>(null);
  const isInitialMount = React.useRef(true);

  // Update indicator position function
  const updateIndicator = React.useCallback(() => {
    if (!tabsListRef.current) return;

    const activeTabElement = tabsListRef.current.querySelector(
      `[data-state="active"]`
    ) as HTMLButtonElement;

    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      
      // For initial mount, set position immediately without animation
      if (isInitialMount.current) {
        setIndicatorStyle({ left: offsetLeft, width: offsetWidth, opacity: 1 });
        isInitialMount.current = false;
      } else {
        // For subsequent updates, animate the transition
        setIndicatorStyle({ left: offsetLeft, width: offsetWidth, opacity: 1 });
      }
    }
  }, []);

  // Handle value change
  const handleValueChange = React.useCallback((newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
    
    // Update indicator after a brief delay to ensure DOM is updated
    setTimeout(() => updateIndicator(), 100);
  }, [onValueChange, updateIndicator]);

  // Update indicator when active tab changes
  React.useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateIndicator();
    });
  }, [activeTab, updateIndicator]);

  // Update indicator on window resize
  React.useEffect(() => {
    const handleResize = () => {
      // Add a small delay to ensure layout is complete
      setTimeout(() => updateIndicator(), 50);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  // Initial setup and mutation observer
  React.useEffect(() => {
    // Initial update with delay to ensure DOM is ready
    const timer = setTimeout(() => {
      updateIndicator();
    }, 200);

    // Observe changes in tab list
    const observer = new MutationObserver((mutations) => {
      // Check if data-state attribute changed
      const hasStateChange = mutations.some(mutation => 
        mutation.type === 'attributes' && mutation.attributeName === 'data-state'
      );
      
      if (hasStateChange) {
        setTimeout(() => updateIndicator(), 10);
      }
    });

    if (tabsListRef.current) {
      observer.observe(tabsListRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-state']
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [updateIndicator]);

  return (
    <TabsPrimitive.Root
      ref={ref}
      className={cn("relative", className)}
      onValueChange={handleValueChange}
      value={value}
      defaultValue={defaultValue}
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
                {/* Animated underline with improved dark theme visibility */}
                <div
                  className="absolute bottom-0 h-0.5 bg-red-600 dark:bg-red-400 transition-all duration-300 ease-out shadow-sm dark:shadow-red-400/50"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    opacity: indicatorStyle.opacity,
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
