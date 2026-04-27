import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: "text" | "rect" | "circle";
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width,
  height,
  borderRadius,
  variant = "rect",
  className = "",
  style = {},
}: SkeletonProps) {
  const finalStyle: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: variant === "circle" ? "50%" : borderRadius,
    ...style,
  };

  return (
    <div 
      className={`${styles.skeleton} ${styles[variant]} ${className}`} 
      style={finalStyle} 
    />
  );
}
