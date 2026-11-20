import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

/**
 * Standard easing curves for premium fluid feel
 */
export const TRANSITION_EASE = [0.25, 0.1, 0.25, 1.0] as const;
export const SPRING_GENTLE = { type: 'spring', damping: 24, stiffness: 260 } as const;
export const SPRING_SNAPPY = { type: 'spring', damping: 20, stiffness: 320 } as const;

/**
 * 1. MotionPage: Wraps page routes with smooth entrance & exit
 */
export interface MotionPageProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export const MotionPage: React.FC<MotionPageProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: TRANSITION_EASE }}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 2. StaggerContainer & StaggerItem: Orchestrates cascading entrances
 */
export const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const itemFadeUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: TRANSITION_EASE },
  },
};

export interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  delay = 0.05,
  ...props
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.07,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div variants={itemFadeUpVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
};

/**
 * 3. MotionCard: Rich, interactive card with subtle elevation and hover physics
 */
export interface MotionCardProps extends HTMLMotionProps<'div'> {
  hoverEffect?: boolean;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  ...props
}) => {
  return (
    <motion.div
      whileHover={
        hoverEffect
          ? {
              y: -3,
              boxShadow:
                '0 12px 24px -10px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
              transition: { duration: 0.2, ease: 'easeOut' },
            }
          : undefined
      }
      whileTap={hoverEffect ? { scale: 0.995 } : undefined}
      className={`transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 4. ScaleIn: For badges, modal dialogs, and alert banners
 */
export const ScaleIn: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={SPRING_GENTLE}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 5. AnimatedNumber: Smooth count up transition
 */
export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.8,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = 0;
    const endVal = value;
    const durationMs = duration * 1000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startVal + (endVal - startVal) * easedProgress));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};
