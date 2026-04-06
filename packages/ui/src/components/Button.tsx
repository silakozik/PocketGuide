import React, { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

export type ButtonProps =
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; variant?: 'primary' | 'outline' | 'gold' | 'default'; size?: 'sm' | 'md' | 'lg' })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: 'primary' | 'outline' | 'gold' | 'default'; size?: 'sm' | 'md' | 'lg' });

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', href, children, ...props }, ref) => {
    // Determine base classes to fit existing design in PocketGuide
    let baseClass = 'btn';
    
    // Map existing class structures to variant
    if (variant === 'primary') baseClass = 'btn-primary';
    if (variant === 'outline') baseClass = 'btn-outline';
    if (variant === 'gold') baseClass = 'btn-gold';

    const finalClassName = `${baseClass} ${className}`.trim();

    if (href) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={finalClassName} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} className={finalClassName} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
