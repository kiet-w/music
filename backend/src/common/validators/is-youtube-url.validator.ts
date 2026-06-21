import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const ALLOWED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

@ValidatorConstraint({ async: false })
export class IsYouTubeUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') return false;

    try {
      const url = new URL(value);

      // Only allow HTTPS (or HTTP for dev)
      if (!['https:', 'http:'].includes(url.protocol)) return false;

      // Only allow hostname in the whitelist
      const hostname = url.hostname.toLowerCase();
      return ALLOWED_HOSTS.includes(hostname);
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'URL must be a valid YouTube URL (youtube.com or youtu.be)';
  }
}

export function IsYouTubeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsYouTubeUrlConstraint,
    });
  };
}
