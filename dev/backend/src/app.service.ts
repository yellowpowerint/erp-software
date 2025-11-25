import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'Mining ERP Backend API is running',
    };
  }
}
