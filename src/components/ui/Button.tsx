import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = ({ className, variant = 'primary', disabled, ...props }: ButtonProps) => {
    const variants = {
        primary: "bg-memoria-clay text-white shadow-lg",
        secondary: "bg-memoria-soft text-memoria-clay",
        ghost: "bg-transparent text-slate-500"
    };

    return (
        <button
            disabled={disabled}
            className={cn(
                "w-full py-4 rounded-[1.5rem] font-bold transition-all active:scale-95",
                variants[variant],
                disabled && "opacity-30 active:scale-100 cursor-not-allowed",
                className
            )}
            {...props}
        />
    );
};