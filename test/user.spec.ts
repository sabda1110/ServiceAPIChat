import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';

describe('userController', () => {
  let app: INestApplication;
  let logger: Logger;
  let testService: TestService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    logger = app.get(WINSTON_MODULE_PROVIDER);
    testService = app.get(TestService);
  });

  describe('POST /api/users', () => {
    beforeEach(async () => {
      await testService.deleteUser();
    });

    it('should be register rejected', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({ username: '', password: '', name: '' });

      logger.info(response.body);
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be register succes', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({ username: 'test', password: 'test', name: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.data.username).toBe('test');
      expect(response.body.data.name).toBe('test');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createUser();
    });

    it('Should be login rejected', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ username: '', password: '' });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('Should be login rejected if password wrong', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ username: 'test', password: 'prth386wo82' });

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });

    it('Should be login rejectd if user not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ username: 'komarru02', password: 'prth386wo82' });

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });

    it('Should be login success', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ username: 'test', password: 'test' });
      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.username).toBe('test');
    });
  });

  describe('GET /api/users/current', () => {
    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createUser();
    });

    it('should be rejected if not login', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/current')
        .set('Authorization', 'Bearer ');
      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });

    it('should be success if login', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/current')
        .set('Authorization', 'test');

      expect(response.status).toBe(200);
      expect(response.body.data.username).toBe('test');
      expect(response.body.data.name).toBe('test');
    });
  });

  describe('Petch /api/users/current', () => {
    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createUser();
    });

    it('Should be rejected update if not login', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/users/current')
        .send({ username: 'test', password: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });

    it('Should be Success update', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/users/current')
        .set('Authorization', 'test')
        .send({
          name: 'bude',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('bude');
    });
  });
});
