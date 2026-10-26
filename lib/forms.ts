// Shared between server actions and client forms.

export type FormState = {
  ok?: boolean;
  error?: string;
};

export type FormAction = (
  previous: FormState,
  formData: FormData,
) => Promise<FormState>;

export const LIMITS = {
  personName: 40,
  wishlistTitle: 80,
  itemName: 120,
  description: 1000,
  url: 2048,
} as const;

export const PIN_LENGTH = 4;
