import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  /**
   * Optional width of the skeleton
   */
  width?: string | number;
  /**
   * Optional height of the skeleton
   */
  height?: string | number;
  /**
   * Optional variant of the skeleton
   * @default "default"
   */
  variant?: "default" | "circle" | "rounded";
}

/**
 * Skeleton component for loading states
 */
const Skeleton = ({
  className,
  width,
  height,
  variant = "default",
  ...props
}: SkeletonProps) => {
  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        {
          "rounded-md": variant === "default",
          "rounded-full": variant === "circle",
          "rounded-lg": variant === "rounded",
        },
        className
      )}
      style={style}
      {...props}
    />
  );
};

export { Skeleton };
