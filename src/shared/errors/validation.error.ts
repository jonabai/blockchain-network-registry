import { DomainError } from './domain.errors';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;
  readonly errors: ValidationErrorDetail[];

  constructor(message: string, errors: ValidationErrorDetail[] = []) {
    super(message);
    this.errors = errors;
  }
}
