import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ApiExceptionFilter } from './api-exception.filter';

@Controller('filter-test')
class FilterTestController {
  @Get('http')
  httpError(): never {
    throw new HttpException('Not found', HttpStatus.NOT_FOUND);
  }

  @Get('crash')
  crash(): never {
    throw new Error('secret internals');
  }
}

describe('ApiExceptionFilter', () => {
  it('maps HttpException to the public error envelope', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FilterTestController],
      providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/filter-test/http`);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: { code: 'REQUEST_ERROR', message: 'Not found' },
      });
    } finally {
      await app.close();
    }
  });

  it('does not expose unhandled error details', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FilterTestController],
      providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/filter-test/crash`);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    } finally {
      await app.close();
    }
  });
});
