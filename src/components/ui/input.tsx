import { Input as HeroInput, InputGroup, Label } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { FieldMessage } from "./field-message";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode;
  error?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

/** Text input on HeroUI's Input / InputGroup, with an optional label and error message. */
function Input({ className, label, error, startContent, endContent, id, ref, ...props }: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const invalid = Boolean(error);
  const a11y = {
    "aria-invalid": invalid || undefined,
    "aria-describedby": cn(props["aria-describedby"], invalid && errorId) || undefined,
  };

  const field =
    startContent || endContent ? (
      <InputGroup fullWidth isInvalid={invalid} className={className}>
        {startContent ? <InputGroup.Prefix className="text-muted">{startContent}</InputGroup.Prefix> : null}
        <InputGroup.Input {...props} {...a11y} id={inputId} ref={ref} />
        {endContent ? <InputGroup.Suffix>{endContent}</InputGroup.Suffix> : null}
      </InputGroup>
    ) : (
      <HeroInput
        {...props}
        {...a11y}
        id={inputId}
        ref={ref}
        fullWidth
        data-invalid={invalid || undefined}
        className={className}
      
      />
    );

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      {label ? (
        <Label htmlFor={inputId} isRequired={props.required}>
          {label}
        </Label>
      ) : null}
      {field}
      <FieldMessage id={errorId} message={error} />
    </div>
  );
}

export { Input };
