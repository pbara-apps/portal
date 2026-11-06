import { Label, TextArea } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { FieldMessage } from "./field-message";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

/** Multi-line text field on HeroUI's TextArea, with an optional label and error message. */
function Textarea({ className, label, error, id, ref, ...props }: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const invalid = Boolean(error);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      {label ? (
        <Label htmlFor={textareaId} isRequired={props.required}>
          {label}
        </Label>
      ) : null}
      <TextArea
        {...props}
        id={textareaId}
        ref={ref}
        fullWidth
        aria-invalid={invalid || undefined}
        aria-describedby={cn(props["aria-describedby"], invalid && errorId) || undefined}
        data-invalid={invalid || undefined}
        className={cn("min-h-[120px]", className)}
      />
      <FieldMessage id={errorId} message={error} />
    </div>
  );
}

export { Textarea };
