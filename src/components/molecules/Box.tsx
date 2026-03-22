import { Component, type HTMLAttributes, type ReactNode } from "react";

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerButtons?: ReactNode;
  bodyClassName?: string;
  footer?: ReactNode;
}

export default class Box extends Component<BoxProps, unknown> {
  override render() {
    const {
      className = "",
      bodyClassName = "",
      children,
      title,
      headerButtons,
      footer,
      ...boxProps
    } = this.props;
    return (
      <div
        {...boxProps}
        className={[
          "max-w-xl",
          "mx-auto",
          "flex",
          "flex-col",
          "bg-white/70",
          "backdrop-blur-xl",
          "dark:bg-zinc-900/70",
          "border",
          "border-white/40",
          "dark:border-white/10",
          "dark:text-slate-100",
          "shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          "dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]",
          "rounded-2xl",
          // 'overflow-hidden',
          ...className.split(" "),
        ].join(" ")}
      >
        {(Boolean(title) || headerButtons) && (
          <div
            className={[
              "p-4",
              "border-b",
              "border-slate-200/50",
              "dark:border-white/10",
              "flex",
              "justify-between",
              "items-center",
            ].join(" ")}
          >
            {title && (
              <h1
                className={[
                  "text-lg",
                  "font-semibold",
                  "text-slate-800",
                  "dark:text-slate-200",
                ].join(" ")}
              >
                {title}
              </h1>
            )}
            {headerButtons}
          </div>
        )}
        <div
          className={[
            "flex-auto",
            "flex",
            "flex-col",
            "gap-4",
            ...bodyClassName.split(" "),
          ].join(" ")}
        >
          {children}
        </div>
        {footer && (
          <div
            className={[
              "px-4",
              "py-2",
              "border-t",
              "border-slate-200/50",
              "dark:border-white/10",
            ].join(" ")}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
}
