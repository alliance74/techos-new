import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  constructor(
    private readonly maxSize: number = 10 * 1024 * 1024, // 10MB
    private readonly allowedMimeTypes?: string[],
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    const files = request.files;

    if (file) {
      this.validateFile(file);
    }

    if (files && Array.isArray(files)) {
      files.forEach((f) => this.validateFile(f));
    }

    return next.handle();
  }

  private validateFile(file: Express.Multer.File) {
    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxSize / 1024 / 1024}MB`,
      );
    }

    if (this.allowedMimeTypes && !this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }
}
